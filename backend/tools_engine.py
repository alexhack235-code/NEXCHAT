import math
import ast
import operator
import datetime
import logging
import os
import sys
import subprocess
import shutil
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

TOOL_REGISTRY = {
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

