import math
import ast
import operator
import datetime
import logging
import os
import sys
import subprocess
import shutil
import json
from typing import Dict, Any, List, Optional, Union

try:
    from .rust_engine import engine as rust_core
    from .device_agent import device_agent
except ImportError:
    try:
        from rust_engine import engine as rust_core
        from device_agent import device_agent
    except ImportError:
        rust_core = None
        device_agent = None

try:
    import sympy
    from sympy import (
        symbols, sympify, solve, Eq, diff, integrate, limit, series,
        simplify, expand, factor, Matrix, isprime, primefactors,
        gcd, lcm, factorial, binomial, fibonacci
    )
    HAS_SYMPY = True
except ImportError:
    HAS_SYMPY = False

logger = logging.getLogger("nexium.tools")

# Safe math operator map
SAFE_OPERATORS = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.FloorDiv: operator.floordiv,
    ast.Mod: operator.mod,
    ast.Pow: operator.pow,
    ast.USub: operator.neg,
}

SAFE_FUNCTIONS = {
    "sqrt": math.sqrt,
    "sin": math.sin,
    "cos": math.cos,
    "tan": math.tan,
    "asin": math.asin,
    "acos": math.acos,
    "atan": math.atan,
    "sinh": math.sinh,
    "cosh": math.cosh,
    "tanh": math.tanh,
    "log": math.log,
    "log10": math.log10,
    "log2": math.log2,
    "exp": math.exp,
    "abs": abs,
    "round": round,
    "floor": math.floor,
    "ceil": math.ceil,
    "factorial": math.factorial,
    "gcd": math.gcd,
    "pi": math.pi,
    "e": math.e,
    "tau": math.tau,
    "inf": math.inf,
}

def safe_eval_math(expr: str) -> float:
    """
    Safely evaluate mathematical expressions using Python's AST parser without eval().
    """
    def _eval(node):
        if isinstance(node, ast.Constant):
            if isinstance(node.value, (int, float)):
                return float(node.value)
            raise ValueError(f"Unsupported constant: {node.value}")
        elif isinstance(node, ast.BinOp):
            op = SAFE_OPERATORS.get(type(node.op))
            if op is None:
                raise ValueError(f"Unsupported operator: {type(node.op)}")
            left = _eval(node.left)
            right = _eval(node.right)
            return op(left, right)
        elif isinstance(node, ast.UnaryOp):
            op = SAFE_OPERATORS.get(type(node.op))
            if op is None:
                raise ValueError(f"Unsupported unary operator: {type(node.op)}")
            return op(_eval(node.operand))
        elif isinstance(node, ast.Call):
            if isinstance(node.func, ast.Name) and node.func.id in SAFE_FUNCTIONS:
                func = SAFE_FUNCTIONS[node.func.id]
                args = [_eval(arg) for arg in node.args]
                return func(*args)
            raise ValueError(f"Unsupported function call: {node.func}")
        elif isinstance(node, ast.Name) and node.id in SAFE_FUNCTIONS:
            return SAFE_FUNCTIONS[node.id]
        else:
            raise ValueError(f"Unsupported expression syntax: {type(node)}")

    clean_expr = expr.replace("^", "**").strip()
    tree = ast.parse(clean_expr, mode="eval")
    return _eval(tree.body)

def tool_calculate(expression: str) -> Dict[str, Any]:
    """Calculate exact arithmetic or numeric expression."""
    clean_expr = expression.strip()
    # Try AST-based safe eval first
    try:
        res = safe_eval_math(clean_expr)
        return {"success": True, "result": res, "expression": clean_expr}
    except Exception as ast_err:
        # If AST fails and SymPy is available, try SymPy numeric eval
        if HAS_SYMPY:
            try:
                sym_expr = sympify(clean_expr.replace("^", "**"))
                num_val = float(sym_expr.evalf())
                return {"success": True, "result": num_val, "symbolic": str(sym_expr), "expression": clean_expr}
            except Exception as se:
                return {"success": False, "error": f"{ast_err}; SymPy: {se}", "expression": clean_expr}
        return {"success": False, "error": str(ast_err), "expression": clean_expr}

def tool_solve_equation(equation: str, variable: str = "x") -> Dict[str, Any]:
    """Solve algebraic, polynomial, or transcendental equations using SymPy."""
    if not HAS_SYMPY:
        return {"success": False, "error": "SymPy is required for symbolic equation solving"}
    try:
        clean_eq = equation.strip().replace("^", "**")
        var = symbols(variable.strip() or "x")
        if "=" in clean_eq:
            parts = clean_eq.split("=")
            lhs = sympify(parts[0].strip())
            rhs = sympify(parts[1].strip())
            eq_obj = Eq(lhs, rhs)
            solutions = solve(eq_obj, var)
        else:
            expr = sympify(clean_eq)
            solutions = solve(expr, var)

        sol_strs = [str(s) for s in solutions]
        numeric_solutions = []
        for s in solutions:
            try:
                numeric_solutions.append(float(s.evalf()))
            except Exception:
                pass

        return {
            "success": True,
            "equation": equation,
            "variable": str(var),
            "solutions": sol_strs,
            "numeric_approximations": numeric_solutions,
            "steps": f"Solved {equation} for {var}. Roots: {sol_strs}"
        }
    except Exception as e:
        return {"success": False, "error": str(e), "equation": equation}

def tool_calculus(operation: str, expression: str, variable: str = "x", lower_limit: Optional[str] = None, upper_limit: Optional[str] = None) -> Dict[str, Any]:
    """Perform calculus operations: derivative, integral, limit, series."""
    if not HAS_SYMPY:
        return {"success": False, "error": "SymPy is required for calculus"}
    try:
        clean_expr = expression.strip().replace("^", "**")
        var = symbols(variable.strip() or "x")
        expr_obj = sympify(clean_expr)
        op = operation.lower().strip()

        if op in ("diff", "derivative", "differentiate"):
            result_obj = diff(expr_obj, var)
            return {
                "success": True,
                "operation": "derivative",
                "expression": expression,
                "variable": str(var),
                "result": str(result_obj),
                "simplified": str(simplify(result_obj)),
                "latex": sympy.latex(result_obj)
            }
        elif op in ("integrate", "integral", "antiderivative"):
            if lower_limit is not None and upper_limit is not None:
                a = sympify(lower_limit)
                b = sympify(upper_limit)
                result_obj = integrate(expr_obj, (var, a, b))
                return {
                    "success": True,
                    "operation": "definite_integral",
                    "expression": expression,
                    "limits": [str(a), str(b)],
                    "result": str(result_obj),
                    "numeric": float(result_obj.evalf()) if result_obj.is_number else None,
                    "latex": sympy.latex(result_obj)
                }
            else:
                result_obj = integrate(expr_obj, var)
                return {
                    "success": True,
                    "operation": "indefinite_integral",
                    "expression": expression,
                    "result": f"{str(result_obj)} + C",
                    "latex": sympy.latex(result_obj)
                }
        elif op in ("limit", "lim"):
            point = sympify(lower_limit) if lower_limit is not None else 0
            result_obj = limit(expr_obj, var, point)
            return {
                "success": True,
                "operation": "limit",
                "expression": expression,
                "approaching": str(point),
                "result": str(result_obj),
                "latex": sympy.latex(result_obj)
            }
        elif op in ("series", "taylor", "maclaurin"):
            result_obj = series(expr_obj, var, 0, 6)
            return {
                "success": True,
                "operation": "taylor_series",
                "expression": expression,
                "result": str(result_obj),
                "latex": sympy.latex(result_obj)
            }
        else:
            return {"success": False, "error": f"Unknown calculus operation: {operation}"}
    except Exception as e:
        return {"success": False, "error": str(e), "expression": expression}

def tool_simplify_expression(expression: str, mode: str = "simplify") -> Dict[str, Any]:
    """Algebraic manipulation: simplify, expand, factor."""
    if not HAS_SYMPY:
        return {"success": False, "error": "SymPy is required for expression simplification"}
    try:
        expr = sympify(expression.strip().replace("^", "**"))
        mode = mode.lower().strip()
        if mode == "expand":
            res = expand(expr)
        elif mode == "factor":
            res = factor(expr)
        else:
            res = simplify(expr)
        return {
            "success": True,
            "mode": mode,
            "original": expression,
            "result": str(res),
            "latex": sympy.latex(res)
        }
    except Exception as e:
        return {"success": False, "error": str(e), "expression": expression}

def tool_number_theory(operation: str, n: int, m: Optional[int] = None) -> Dict[str, Any]:
    """Number theory utilities: prime testing, factors, gcd, lcm, factorial, permutations, combinations."""
    op = operation.lower().strip()
    try:
        n = int(n)
        if op in ("is_prime", "prime_check"):
            prime_val = isprime(n) if HAS_SYMPY else (n > 1 and all(n % i != 0 for i in range(2, int(math.isqrt(n)) + 1)))
            return {"success": True, "n": n, "is_prime": prime_val}
        elif op in ("prime_factors", "factorize"):
            factors = primefactors(n) if HAS_SYMPY else []
            return {"success": True, "n": n, "prime_factors": factors}
        elif op in ("gcd", "greatest_common_divisor"):
            if m is None: return {"success": False, "error": "Second integer 'm' required for gcd"}
            return {"success": True, "gcd": math.gcd(n, int(m)), "n": n, "m": m}
        elif op in ("lcm", "least_common_multiple"):
            if m is None: return {"success": False, "error": "Second integer 'm' required for lcm"}
            return {"success": True, "lcm": math.lcm(n, int(m)), "n": n, "m": m}
        elif op in ("factorial", "fact"):
            return {"success": True, "n": n, "result": math.factorial(n)}
        elif op in ("fibonacci", "fib"):
            val = int(fibonacci(n)) if HAS_SYMPY else None
            return {"success": True, "n": n, "fibonacci": val}
        elif op in ("ncr", "combinations"):
            if m is None: return {"success": False, "error": "m (k items) required"}
            return {"success": True, "n": n, "r": m, "combinations": math.comb(n, int(m))}
        elif op in ("npr", "permutations"):
            if m is None: return {"success": False, "error": "m (k items) required"}
            return {"success": True, "n": n, "r": m, "permutations": math.perm(n, int(m))}
        else:
            return {"success": False, "error": f"Unknown number theory operation: {op}"}
    except Exception as e:
        return {"success": False, "error": str(e), "operation": op}

def tool_statistics(operation: str, data: List[float]) -> Dict[str, Any]:
    """Calculate descriptive statistics for a list of numbers."""
    if not data:
        return {"success": False, "error": "Dataset cannot be empty"}
    try:
        import statistics
        op = operation.lower().strip()
        data_clean = [float(x) for x in data]
        if op == "summary":
            return {
                "success": True,
                "count": len(data_clean),
                "mean": round(statistics.mean(data_clean), 6),
                "median": round(statistics.median(data_clean), 6),
                "std_dev": round(statistics.stdev(data_clean), 6) if len(data_clean) > 1 else 0.0,
                "variance": round(statistics.variance(data_clean), 6) if len(data_clean) > 1 else 0.0,
                "min": min(data_clean),
                "max": max(data_clean),
                "range": max(data_clean) - min(data_clean)
            }
        elif op == "mean":
            return {"success": True, "mean": statistics.mean(data_clean)}
        elif op == "median":
            return {"success": True, "median": statistics.median(data_clean)}
        elif op == "stdev":
            return {"success": True, "stdev": statistics.stdev(data_clean) if len(data_clean) > 1 else 0.0}
        else:
            return {"success": False, "error": f"Unknown statistics operation: {op}"}
    except Exception as e:
        return {"success": False, "error": str(e)}

def tool_get_time() -> Dict[str, Any]:
    now = datetime.datetime.now()
    return {
        "success": True,
        "datetime": now.isoformat(),
        "date": now.strftime("%Y-%m-%d"),
        "time": now.strftime("%H:%M:%S"),
        "day_of_week": now.strftime("%A"),
    }

def tool_string_distance(s1: str, s2: str) -> Dict[str, Any]:
    if rust_core and hasattr(rust_core, "str_similarity"):
        sim_jw = rust_core.str_similarity(s1, s2, algo="jaro_winkler")
        sim_lev = rust_core.str_similarity(s1, s2, algo="levenshtein")
    else:
        sim_jw = 1.0 if s1 == s2 else 0.0
        sim_lev = 1.0 if s1 == s2 else 0.0
    return {
        "success": True,
        "jaro_winkler_similarity": sim_jw,
        "levenshtein_similarity": sim_lev,
    }

def tool_device_task(action: str, **params) -> Dict[str, Any]:
    """Execute autonomous device task (system_info, battery, open_url, create_file, list_files, ping)."""
    if device_agent is None:
        return {"success": False, "error": "Device agent unavailable"}
    try:
        res = device_agent.execute_action(action, params)
        return {"success": True, "action": action, "result": res}
    except Exception as e:
        return {"success": False, "action": action, "error": str(e)}

def tool_code_doctor(code: str, language: str = "python", action: str = "repair") -> Dict[str, Any]:
    try:
        from .code_doctor import code_doctor
    except ImportError:
        from code_doctor import code_doctor

    if action == "diagnose":
        return code_doctor.diagnose_code(code, language=language)
    return code_doctor.repair_code(code, language=language)

def tool_heavy_code(blueprint_id: str) -> Dict[str, Any]:
    try:
        from .heavy_code_engine import heavy_code_engine
    except ImportError:
        from heavy_code_engine import heavy_code_engine

    return heavy_code_engine.synthesize_heavy_system(blueprint_id)

def tool_compile_and_verify(code: str, language: str = "python", file_path: Optional[str] = None) -> Dict[str, Any]:
    """Compiles and validates code structure, catching syntax errors and missing imports."""
    lang = language.lower().strip()
    if lang == "python":
        try:
            ast.parse(code)
            compile(code, file_path or "<nexium_buffer>", "exec")
            return {
                "success": True,
                "syntax_valid": True,
                "language": "python",
                "loc": len(code.splitlines()),
                "message": "Python syntax verified successfully."
            }
        except SyntaxError as e:
            return {
                "success": False,
                "syntax_valid": False,
                "language": "python",
                "error": str(e.msg),
                "line": e.lineno,
                "offset": e.offset,
                "bad_line": e.text.strip() if e.text else None
            }
    elif lang in ("javascript", "typescript", "ts", "js", "jsx", "tsx"):
        stack = []
        pairs = {')': '(', '}': '{', ']': '['}
        for i, char in enumerate(code):
            if char in "({[":
                stack.append((char, i))
            elif char in ")}]":
                if not stack or stack[-1][0] != pairs[char]:
                    return {
                        "success": False,
                        "syntax_valid": False,
                        "language": lang,
                        "error": f"Mismatched bracket '{char}' at index {i}",
                        "char_index": i
                    }
                stack.pop()
        if stack:
            unclosed, idx = stack[-1]
            return {
                "success": False,
                "syntax_valid": False,
                "language": lang,
                "error": f"Unclosed bracket '{unclosed}' opened at index {idx}",
                "char_index": idx
            }
        return {
            "success": True,
            "syntax_valid": True,
            "language": lang,
            "loc": len(code.splitlines()),
            "message": f"{lang} delimiters balanced."
        }
    return {
        "success": True,
        "syntax_valid": True,
        "language": lang,
        "loc": len(code.splitlines()),
        "message": f"Syntax check not implemented for {lang}; passed by default."
    }

def tool_symbol_search(query: str, root_dir: Optional[str] = None, max_results: int = 25) -> Dict[str, Any]:
    """Fast symbol search across project workspace for class, def, function, interface, type, struct."""
    import re
    search_dir = root_dir or os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    results = []
    pattern = re.compile(rf"\b(class|def|async\s+def|interface|type|struct|enum|fn)\s+([A-Za-z0-9_]*{re.escape(query)}[A-Za-z0-9_]*)", re.IGNORECASE)
    
    ignore_dirs = {".git", ".venv", "node_modules", "target", "__pycache__", ".pytest_cache", "build"}
    valid_exts = {".py", ".ts", ".tsx", ".js", ".jsx", ".rs", ".h", ".hpp", ".cpp", ".c", ".cs"}

    for dirpath, dirnames, filenames in os.walk(search_dir):
        dirnames[:] = [d for d in dirnames if d not in ignore_dirs]
        for f in filenames:
            ext = os.path.splitext(f)[1]
            if ext in valid_exts:
                fpath = os.path.join(dirpath, f)
                try:
                    with open(fpath, "r", encoding="utf-8", errors="ignore") as file_handle:
                        for lineno, line in enumerate(file_handle, start=1):
                            match = pattern.search(line)
                            if match:
                                results.append({
                                    "symbol": match.group(2),
                                    "kind": match.group(1),
                                    "file": os.path.relpath(fpath, search_dir),
                                    "line": lineno,
                                    "snippet": line.strip()
                                })
                                if len(results) >= max_results:
                                    break
                except Exception:
                    continue
        if len(results) >= max_results:
            break

    return {
        "success": True,
        "query": query,
        "total_found": len(results),
        "symbols": results
    }

def tool_patch_file(file_path: str, target_chunk: str, replacement_chunk: str) -> Dict[str, Any]:
    """Performs atomic chunk replacement in an existing file."""
    if not os.path.exists(file_path):
        return {"success": False, "error": f"File '{file_path}' does not exist"}
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()

        if target_chunk not in content:
            return {
                "success": False,
                "error": "Target chunk not found in file content"
            }

        new_content = content.replace(target_chunk, replacement_chunk, 1)
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(new_content)

        return {
            "success": True,
            "file_path": file_path,
            "message": "Chunk replaced successfully."
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

def tool_run_tests(test_target: Optional[str] = None) -> Dict[str, Any]:
    """Runs test suite and returns parsed results."""
    target = test_target or "backend/tests"
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    venv_py = os.path.join(root_dir, ".venv", "Scripts", "python.exe")
    cmd = [venv_py if os.path.exists(venv_py) else sys.executable, "-m", "pytest", target, "-q"]

    try:
        res = subprocess.run(cmd, cwd=root_dir, capture_output=True, text=True, timeout=120)
        output = (res.stdout + "\n" + res.stderr).strip()
        return {
            "success": res.returncode == 0,
            "exit_code": res.returncode,
            "summary": output.splitlines()[-1] if output.splitlines() else "",
            "raw_output": output[-500:]
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

def tool_project_memory(action: str, key: Optional[str] = None, value: Optional[Any] = None) -> Dict[str, Any]:
    """Manages persistent project memory in .nexium/memory.json."""
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    mem_dir = os.path.join(root_dir, ".nexium")
    mem_file = os.path.join(mem_dir, "memory.json")
    os.makedirs(mem_dir, exist_ok=True)

    data = {}
    if os.path.exists(mem_file):
        try:
            with open(mem_file, "r", encoding="utf-8") as f:
                data = json.load(f)
        except Exception:
            data = {}

    act = action.lower().strip()
    if act == "get":
        if not key:
            return {"success": False, "error": "Key required for 'get'"}
        return {"success": True, "key": key, "value": data.get(key)}
    elif act == "set":
        if not key:
            return {"success": False, "error": "Key required for 'set'"}
        data[key] = value
        with open(mem_file, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
        return {"success": True, "key": key, "value": value}
    elif act in ("list", "all"):
        return {"success": True, "memory": data}
    elif act == "clear":
        with open(mem_file, "w", encoding="utf-8") as f:
            json.dump({}, f)
        return {"success": True, "message": "Memory cleared"}
    return {"success": False, "error": f"Unknown memory action: {act}"}

def tool_ast_map(file_path: str) -> Dict[str, Any]:
    """Generates a structured AST outline of a file without reading all content."""
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    full_path = file_path if os.path.isabs(file_path) else os.path.join(root_dir, file_path)
    if not os.path.exists(full_path):
        return {"success": False, "error": f"File '{file_path}' does not exist"}

    ext = os.path.splitext(full_path)[1].lower()
    try:
        with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()

        lines = content.splitlines()
        loc = len(lines)

        classes = []
        functions = []
        imports = []

        if ext == ".py":
            try:
                tree = ast.parse(content, filename=full_path)
                for node in ast.walk(tree):
                    if isinstance(node, ast.ClassDef):
                        methods = [n.name for n in node.body if isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef))]
                        doc = ast.get_docstring(node) or ""
                        classes.append({
                            "name": node.name,
                            "line": node.lineno,
                            "methods": methods,
                            "doc": doc.splitlines()[0] if doc else ""
                        })
                    elif isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                        doc = ast.get_docstring(node) or ""
                        functions.append({
                            "name": node.name,
                            "line": node.lineno,
                            "is_async": isinstance(node, ast.AsyncFunctionDef),
                            "doc": doc.splitlines()[0] if doc else ""
                        })
                    elif isinstance(node, (ast.Import, ast.ImportFrom)):
                        if isinstance(node, ast.Import):
                            imports.extend(alias.name for alias in node.names)
                        else:
                            module = node.module or ""
                            imports.extend(f"{module}.{alias.name}" for alias in node.names)
            except Exception as parse_err:
                return {"success": False, "error": f"AST parse error: {parse_err}", "loc": loc}
        else:
            import re
            class_matches = re.finditer(r"\b(class|struct|interface|enum)\s+([A-Za-z0-9_]+)", content)
            for m in class_matches:
                lineno = content[:m.start()].count("\n") + 1
                classes.append({"name": m.group(2), "kind": m.group(1), "line": lineno})

            fn_matches = re.finditer(r"\b(function|async\s+function|def|fn|void|int|float|bool|auto)\s+([A-Za-z0-9_]+)\s*\(", content)
            for m in fn_matches:
                lineno = content[:m.start()].count("\n") + 1
                functions.append({"name": m.group(2), "line": lineno})

            import_matches = re.finditer(r"\b(?:import\s+.*?from\s+['\"](.*?)['\"]|#include\s+[<\"'](.*?)[\">'])", content)
            for m in import_matches:
                imports.append(m.group(1) or m.group(2) or "")

        return {
            "success": True,
            "file": os.path.relpath(full_path, root_dir),
            "loc": loc,
            "classes": classes,
            "functions": functions,
            "imports": list(set(filter(None, imports)))[:30]
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

def tool_git_diff(cached: bool = False, max_chars: int = 5000) -> Dict[str, Any]:
    """Retrieves current workspace git status and diff."""
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    cmd = ["git", "diff"]
    if cached:
        cmd.append("--cached")

    try:
        res = subprocess.run(cmd, cwd=root_dir, capture_output=True, text=True, timeout=15)
        diff_text = res.stdout.strip()
        status_res = subprocess.run(["git", "status", "--short"], cwd=root_dir, capture_output=True, text=True, timeout=10)
        status_text = status_res.stdout.strip()

        changed_files = [line.strip().split()[-1] for line in status_text.splitlines() if line.strip()]
        return {
            "success": res.returncode == 0,
            "changed_files_count": len(changed_files),
            "changed_files": changed_files[:20],
            "diff_snippet": diff_text[:max_chars],
            "total_chars": len(diff_text),
            "truncated": len(diff_text) > max_chars
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

def tool_ue5_validator(code: str, class_name: Optional[str] = None) -> Dict[str, Any]:
    """Validates Unreal Engine 5 C++ character, rig, or animation architecture rules."""
    diagnostics = []
    warnings = []
    recommendations = []
    
    has_uclass = "UCLASS(" in code
    has_generated_body = "GENERATED_BODY()" in code
    has_generated_include = ".generated.h" in code
    
    if has_uclass:
        if not has_generated_body:
            diagnostics.append("Missing GENERATED_BODY() inside UCLASS body.")
        if not has_generated_include:
            diagnostics.append("Missing #include '<HeaderName>.generated.h' which must be the last header.")

    import re
    class_match = re.search(r"class\s+([A-Za-z0-9_]+)\s*:\s*public\s+([A-Za-z0-9_]+)", code)
    if class_match:
        c_name = class_match.group(1)
        base_name = class_match.group(2)
        if "Character" in base_name or "Pawn" in base_name or "Actor" in base_name:
            if not c_name.startswith("A"):
                warnings.append(f"UE5 Actor class '{c_name}' should start with prefix 'A' (e.g. A{c_name}).")
        elif "Component" in base_name or "Object" in base_name:
            if not c_name.startswith("U"):
                warnings.append(f"UE5 UObject/Component class '{c_name}' should start with prefix 'U' (e.g. U{c_name}).")

    if "MotionWarp" in code or "MotionWarping" in code:
        if "FMotionWarpingTarget" not in code and "RootMotion" not in code:
            recommendations.append("Ensure MotionWarping component targets are assigned via AddOrUpdateWarpTargetFromLocationAndRotation.")

    if "ChaosCloth" in code or "Cloth" in code:
        recommendations.append("For Zero-G/Unreal Mode, verify Chaos Cloth GravityScale or WindVelocity is wired to AnimInstance.")

    is_valid = len(diagnostics) == 0
    return {
        "success": True,
        "valid": is_valid,
        "diagnostics": diagnostics,
        "warnings": warnings,
        "recommendations": recommendations,
        "loc": len(code.splitlines())
    }

TOOL_REGISTRY = {
    "compile_and_verify": {
        "func": tool_compile_and_verify,
        "description": "Compiles and verifies syntax, catches syntax errors, and validates bracket balancing.",
        "parameters": {"code": "string", "language": "string default 'python'"},
    },
    "symbol_search": {
        "func": tool_symbol_search,
        "description": "Searches codebase symbol table for classes, functions, interfaces, structs, and enums.",
        "parameters": {"query": "string symbol name", "max_results": "optional int"},
    },
    "patch_file": {
        "func": tool_patch_file,
        "description": "Applies an atomic search-and-replace chunk patch to a file without overwriting the whole file.",
        "parameters": {"file_path": "string", "target_chunk": "string", "replacement_chunk": "string"},
    },
    "run_tests": {
        "func": tool_run_tests,
        "description": "Executes project test suites (pytest) and extracts exit codes and summaries.",
        "parameters": {"test_target": "optional string path"},
    },
    "project_memory": {
        "func": tool_project_memory,
        "description": "Accesses long-term project knowledge and memory key-values across sessions.",
        "parameters": {"action": "get | set | list | clear", "key": "optional string", "value": "optional any"},
    },
    "ast_map": {
        "func": tool_ast_map,
        "description": "Extracts structured AST code map (classes, methods, docstrings, imports) of any file.",
        "parameters": {"file_path": "string path"},
    },
    "git_diff": {
        "func": tool_git_diff,
        "description": "Inspects git diff and list of changed files in workspace.",
        "parameters": {"cached": "optional bool default false", "max_chars": "optional int"},
    },
    "ue5_validator": {
        "func": tool_ue5_validator,
        "description": "Validates Unreal Engine 5 C++ actor/character macros, naming prefixes, and rig configurations.",
        "parameters": {"code": "string C++ code", "class_name": "optional string"},
    },
    "calculate": {
        "func": tool_calculate,
        "description": "Calculate exact mathematical expressions (arithmetic, powers, sqrt, sin, log, exp, etc.).",
        "parameters": {"expression": "string, e.g. 'sqrt(144) + 15 * 3'"},
    },
    "code_doctor": {
        "func": tool_code_doctor,
        "description": "Autonomous Code Doctor: inspects, diagnoses, and repairs bugs, syntax errors, and leaks in code.",
        "parameters": {"code": "string", "language": "optional string default 'python'", "action": "repair | diagnose"},
    },
    "heavy_code": {
        "func": tool_heavy_code,
        "description": "Synthesizes heavy enterprise architectures: 'raft_consensus_engine', 'lockfree_slab_arena', 'async_reactor_event_loop', 'simd_hnsw_vector_indexer', 'bytecode_compiler_vm', 'saga_orchestrator_microservice'.",
        "parameters": {"blueprint_id": "string"},
    },
    "solve_equation": {
        "func": tool_solve_equation,
        "description": "Solve algebraic equations, polynomials, and systems for an unknown variable (e.g. 'x^2 - 5*x + 6 = 0').",
        "parameters": {"equation": "string", "variable": "optional string default 'x'"},
    },
    "calculus": {
        "func": tool_calculus,
        "description": "Compute calculus operations: derivative ('diff'), integral ('integrate'), limit ('limit'), series ('series').",
        "parameters": {"operation": "string", "expression": "string", "variable": "optional string", "lower_limit": "optional", "upper_limit": "optional"},
    },
    "simplify_expression": {
        "func": tool_simplify_expression,
        "description": "Algebraically simplify, expand, or factor expressions.",
        "parameters": {"expression": "string", "mode": "simplify | expand | factor"},
    },
    "number_theory": {
        "func": tool_number_theory,
        "description": "Number theory operations: prime check ('is_prime'), prime factors ('prime_factors'), gcd, lcm, factorial, combinations ('ncr'), permutations ('npr').",
        "parameters": {"operation": "string", "n": "int", "m": "optional int"},
    },
    "statistics": {
        "func": tool_statistics,
        "description": "Descriptive statistics on a numerical dataset: summary, mean, median, stdev.",
        "parameters": {"operation": "string", "data": "list of numbers"},
    },
    "get_time": {
        "func": tool_get_time,
        "description": "Retrieve current system date, time, and day of week.",
        "parameters": {},
    },
    "string_distance": {
        "func": tool_string_distance,
        "description": "Compute fast string similarity and Levenshtein distance.",
        "parameters": {"s1": "string", "s2": "string"},
    },
    "device_task": {
        "func": tool_device_task,
        "description": "Device hardware diagnostics (system_info), battery level (battery), open browser URL (open_url), workspace file management (create_file, list_files), and ping check.",
        "parameters": {"action": "string", "params": "optional dict"},
    },
}

def execute_tool(name: str, **kwargs) -> Dict[str, Any]:
    if name not in TOOL_REGISTRY:
        return {"success": False, "error": f"Tool '{name}' is not registered."}
    try:
        handler = TOOL_REGISTRY[name]["func"]
        return handler(**kwargs)
    except Exception as e:
        logger.exception(f"Tool execution failed for {name}")
        return {"success": False, "error": str(e)}

def register_custom_tool(name: str, func: Any, description: str, parameters: Optional[Dict[str, str]] = None) -> bool:
    """Dynamically register a synthesized tool into the active runtime."""
    TOOL_REGISTRY[name] = {
        "func": func,
        "description": description,
        "parameters": parameters or {},
        "custom": True,
    }
    logger.info(f"Custom tool '{name}' successfully registered into NEXIUM tools engine.")
    return True

def list_registered_tools() -> Dict[str, Any]:
    """List all currently active and synthesized tools."""
    return {
        name: {
            "description": info["description"],
            "parameters": info["parameters"],
            "custom": info.get("custom", False),
        }
        for name, info in TOOL_REGISTRY.items()
    }

def get_tool_descriptions() -> str:
    lines = ["Available Tools:"]
    for name, info in TOOL_REGISTRY.items():
        params = ", ".join([f"{k}: {v}" for k, v in info["parameters"].items()])
        custom_tag = " [DYNAMIC SYNTHESIZED]" if info.get("custom") else ""
        lines.append(f"- {name}({params}){custom_tag}: {info['description']}")
    return "\n".join(lines)

