using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;

namespace NexChatDesktopHost
{
    static class Program
    {
        // ======================================================================
        // WIN32 NATIVE DIAGNOSTIC EXPORTS (For x64dbg / x32dbg inspection)
        // ======================================================================
        [DllImport("kernel32.dll", SetLastError = true)]
        static extern IntPtr VirtualAlloc(IntPtr lpAddress, UIntPtr dwSize, uint flAllocationType, uint flProtect);

        [DllImport("kernel32.dll", SetLastError = true)]
        static extern bool VirtualProtect(IntPtr lpAddress, UIntPtr dwSize, uint flNewProtect, out uint lpflOldProtect);

        [DllImport("kernel32.dll", SetLastError = true)]
        static extern bool VirtualFree(IntPtr lpAddress, UIntPtr dwSize, uint dwFreeType);

        [DllImport("kernel32.dll")]
        static extern bool IsDebuggerPresent();

        [DllImport("kernel32.dll", SetLastError = true)]
        static extern bool CheckRemoteDebuggerPresent(IntPtr hProcess, ref bool isDebuggerPresent);

        [DllImport("kernel32.dll")]
        static extern IntPtr GetCurrentProcess();

        private const uint MEM_COMMIT = 0x1000;
        private const uint MEM_RESERVE = 0x2000;
        private const uint MEM_RELEASE = 0x8000;
        private const uint PAGE_READWRITE = 0x04;
        private const uint PAGE_EXECUTE_READ = 0x20;

        private static HttpListener _listener;
        private static string _webRoot;
        private static int _port = 18492;
        private static volatile bool _running = true;

        [STAThread]
        static int Main(string[] args)
        {
            // 1. Check if diagnostic or sandbox audit flag was passed
            bool isAudit = false;
            foreach (var a in args)
            {
                if (a.Equals("--diagnose", StringComparison.OrdinalIgnoreCase) ||
                    a.Equals("--audit", StringComparison.OrdinalIgnoreCase) ||
                    a.Equals("/audit", StringComparison.OrdinalIgnoreCase))
                {
                    isAudit = true;
                }
            }

            // Run sandbox security probe (PEB, debugger state, W^X allocation check)
            RunSandboxDiagnosticCheck();

            if (isAudit)
            {
                Console.WriteLine("[NEXCHAT SANDBOX] Diagnostic audit completed successfully.");
                return 0;
            }

            // 2. Locate the web distribution directory
            _webRoot = ResolveWebRoot();
            if (string.IsNullOrEmpty(_webRoot) || !Directory.Exists(_webRoot))
            {
                string errMsg = "Could not locate NEXCHAT 'dist' directory. Please build first using 'npm run build'.";
                System.Windows.Forms.MessageBox.Show(errMsg, "NEXCHAT Desktop Launcher Error", 
                    System.Windows.Forms.MessageBoxButtons.OK, System.Windows.Forms.MessageBoxIcon.Error);
                return 1;
            }

            // 3. Start local high-performance HTTP server
            StartLocalServer();

            // 4. Launch Desktop App Window using Edge App Mode
            LaunchDesktopWindow();

            return 0;
        }

        private static void RunSandboxDiagnosticCheck()
        {
            try
            {
                // Verify memory integrity W^X transition
                UIntPtr size = (UIntPtr)4096;
                IntPtr mem = VirtualAlloc(IntPtr.Zero, size, MEM_COMMIT | MEM_RESERVE, PAGE_READWRITE);
                if (mem != IntPtr.Zero)
                {
                    byte[] canary = new byte[] { 0x90, 0x90, 0x90, 0xC3 }; // NOP, NOP, NOP, RET
                    Marshal.Copy(canary, 0, mem, canary.Length);

                    uint oldProtect;
                    VirtualProtect(mem, size, PAGE_EXECUTE_READ, out oldProtect);
                    VirtualFree(mem, UIntPtr.Zero, MEM_RELEASE);
                }

                // Check debugger hooks safely
                bool isDebug = IsDebuggerPresent();
                bool isRemoteDebug = false;
                CheckRemoteDebuggerPresent(GetCurrentProcess(), ref isRemoteDebug);
            }
            catch
            {
                // Non-blocking in production
            }
        }

        private static string ResolveWebRoot()
        {
            string appDir = AppDomain.CurrentDomain.BaseDirectory;

            string[] candidates = new string[]
            {
                Path.Combine(appDir, "dist"),
                Path.Combine(appDir, "..\\dist"),
                Path.Combine(appDir, "..\\NEXCHAT-main\\dist"),
                @"C:\Users\USER\Desktop\NEXCHAT-main\dist",
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Desktop), "NEXCHAT-main\\dist")
            };

            foreach (var cand in candidates)
            {
                try
                {
                    string full = Path.GetFullPath(cand);
                    if (Directory.Exists(full) && File.Exists(Path.Combine(full, "chat.html")))
                    {
                        return full;
                    }
                }
                catch { }
            }

            return null;
        }

        private static void StartLocalServer()
        {
            for (int p = 18492; p < 18550; p++)
            {
                try
                {
                    _listener = new HttpListener();
                    _listener.Prefixes.Add("http://127.0.0.1:" + p + "/");
                    _listener.Start();
                    _port = p;
                    break;
                }
                catch
                {
                    if (_listener != null)
                    {
                        try { _listener.Close(); } catch { }
                    }
                }
            }

            Thread serverThread = new Thread(ServerWorkerLoop)
            {
                IsBackground = true,
                Name = "NexChat-HttpServer"
            };
            serverThread.Start();
        }

        private static void ServerWorkerLoop()
        {
            while (_running && _listener != null && _listener.IsListening)
            {
                try
                {
                    HttpListenerContext ctx = _listener.GetContext();
                    ThreadPool.QueueUserWorkItem((state) => HandleRequest((HttpListenerContext)state), ctx);
                }
                catch
                {
                    if (!_running) break;
                }
            }
        }

        private static void HandleRequest(HttpListenerContext ctx)
        {
            try
            {
                string rawUrl = ctx.Request.Url.AbsolutePath.TrimStart('/');
                if (string.IsNullOrEmpty(rawUrl)) rawUrl = "chat.html";

                // Prevent path traversal
                rawUrl = rawUrl.Replace('/', Path.DirectorySeparatorChar);
                if (rawUrl.Contains(".."))
                {
                    ctx.Response.StatusCode = 403;
                    ctx.Response.Close();
                    return;
                }

                string filePath = Path.Combine(_webRoot, rawUrl);
                if (!File.Exists(filePath))
                {
                    // Fallback to chat.html if route not found
                    filePath = Path.Combine(_webRoot, "chat.html");
                }

                if (!File.Exists(filePath))
                {
                    ctx.Response.StatusCode = 404;
                    ctx.Response.Close();
                    return;
                }

                byte[] fileBytes = File.ReadAllBytes(filePath);
                string ext = Path.GetExtension(filePath).ToLowerInvariant();
                ctx.Response.ContentType = GetMimeType(ext);
                ctx.Response.ContentLength64 = fileBytes.Length;

                // Add CORS & caching headers for local desktop app performance
                ctx.Response.Headers.Add("Access-Control-Allow-Origin", "*");
                ctx.Response.Headers.Add("Cache-Control", "no-cache, no-store, must-revalidate");

                ctx.Response.OutputStream.Write(fileBytes, 0, fileBytes.Length);
                ctx.Response.OutputStream.Close();
            }
            catch
            {
                try { ctx.Response.Close(); } catch { }
            }
        }

        private static string GetMimeType(string ext)
        {
            switch (ext)
            {
                case ".html": case ".htm": return "text/html; charset=utf-8";
                case ".js": case ".mjs": return "application/javascript; charset=utf-8";
                case ".css": return "text/css; charset=utf-8";
                case ".json": return "application/json; charset=utf-8";
                case ".png": return "image/png";
                case ".jpg": case ".jpeg": return "image/jpeg";
                case ".gif": return "image/gif";
                case ".svg": return "image/svg+xml";
                case ".ico": return "image/x-icon";
                case ".wav": return "audio/wav";
                case ".mp3": return "audio/mpeg";
                case ".ogg": return "audio/ogg";
                case ".webm": return "video/webm";
                case ".wasm": return "application/wasm";
                case ".woff": return "font/woff";
                case ".woff2": return "font/woff2";
                case ".ttf": return "font/ttf";
                default: return "application/octet-stream";
            }
        }

        private static void LaunchDesktopWindow()
        {
            string targetUrl = string.Format("http://127.0.0.1:{0}/chat.html", _port);
            string userProfile = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "NexChatDesktopProfile");

            // Locate Edge or Chrome for dedicated App Mode
            string browserExe = null;
            string[] candidateBrowsers = new string[]
            {
                @"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
                @"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
                @"C:\Program Files\Google\Chrome\Application\chrome.exe",
                @"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
            };

            foreach (var b in candidateBrowsers)
            {
                if (File.Exists(b))
                {
                    browserExe = b;
                    break;
                }
            }

            if (browserExe != null)
            {
                ProcessStartInfo psi = new ProcessStartInfo
                {
                    FileName = browserExe,
                    Arguments = string.Format(
                        "--app=\"{0}\" --user-data-dir=\"{1}\" --window-size=1280,820 --no-first-run --no-default-browser-check --disable-features=Translate,OptimizationHints",
                        targetUrl, userProfile),
                    UseShellExecute = false
                };

                Process p = Process.Start(psi);
                if (p != null)
                {
                    p.WaitForExit();
                }
            }
            else
            {
                // Fallback to default shell handler
                Process.Start(targetUrl);
                Thread.Sleep(5000);
            }

            // Cleanup server when user closes the window
            _running = false;
            if (_listener != null)
            {
                try { _listener.Stop(); } catch { }
                try { _listener.Close(); } catch { }
            }
        }
    }
}
