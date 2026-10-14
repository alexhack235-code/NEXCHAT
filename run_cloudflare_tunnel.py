import subprocess, time, re, sys

def main():
    print('[Cloudflare Tunnel] Starting tunnel for http://127.0.0.1:8000 ...')
    cmd = ['cloudflared.exe', 'tunnel', '--url', 'http://127.0.0.1:8000']
    
    while True:
        try:
            p = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1
            )
            for line in iter(p.stdout.readline, ''):
                sys.stdout.write(line)
                sys.stdout.flush()
                m = re.search(r'https://[a-zA-Z0-9-]+\.trycloudflare\.com', line)
                if m:
                    url = m.group(0)
                    with open('tunnel_url.txt', 'w') as f:
                        f.write(url)
                    print(f'\n=======================================================\n[ACTIVE PRIVATE CLOUDFLARE ANDROID HOST]: {url}\n=======================================================\n')
            p.wait()
            print('[Cloudflare Tunnel] Disconnected. Restarting in 15s...')
            time.sleep(15)
        except Exception as e:
            print(f'[Cloudflare Tunnel Error] {e}. Restarting in 5s...')
            time.sleep(5)

if __name__ == '__main__':
    main()
