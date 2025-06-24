# Setup Preview - WSL2 Development Server

This guide explains how to properly set up and access a Vite development server running in WSL2 from a Windows browser.

## Quick Start

```bash
# Start the development server
npm run dev

# Or run in background with logging
nohup npm run dev > dev-server.log 2>&1 &
```

Then open in Windows browser:
- http://localhost:5173
- http://172.28.90.86:5173 (your WSL IP may differ)

## Configuration Required

### 1. Vite Configuration
Add this to `vite.config.js`:

```javascript
export default defineConfig({
  // ... other config
  server: {
    host: true,        // Listen on all network interfaces
    port: 5173,
    strictPort: true,
    watch: {
      usePolling: true // Required for WSL2 file watching
    }
  }
})
```

### 2. Find Your WSL IP Address
```bash
# In WSL terminal
hostname -I
# Returns something like: 172.28.90.86
```

### 3. Windows Firewall (if needed)
If the server is blocked, run in Windows PowerShell as Administrator:
```powershell
New-NetFirewallRule -DisplayName 'WSL2 Vite Dev Server' -Direction Inbound -LocalPort 5173 -Protocol TCP -Action Allow
```

## Troubleshooting

### Check if server is running
```bash
# Check if Vite process exists
ps aux | grep vite | grep -v grep

# Check if port is listening
lsof -i :5173

# Check server logs (if running in background)
cat dev-server.log
```

### Kill existing server
```bash
# Find and kill process on port 5173
kill $(lsof -t -i:5173) 2>/dev/null || true
```

### Test server accessibility
```bash
# From WSL
curl -I http://localhost:5173

# Check active connections
lsof -i :5173
```

## Common Issues

1. **"Connection Refused" in Windows browser**
   - Make sure `host: true` is set in vite.config.js
   - Check if server is actually running
   - Try WSL IP instead of localhost

2. **Hot reload not working**
   - Ensure `usePolling: true` is set for WSL2
   - File watching across Windows/WSL boundary can be slow

3. **Can't find WSL IP**
   - Run `ipconfig` in Windows Command Prompt
   - Look for "Ethernet adapter vEthernet (WSL)"
   - Use that IP address

## Verification

Once running, you should see:
```
  VITE v6.3.5  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://172.28.90.86:5173/
```

The Network URL is what you need for Windows browser access.

## Background Running

To keep server running after closing terminal:
```bash
# Start in background
nohup npm run dev > dev-server.log 2>&1 &

# Check logs
tail -f dev-server.log

# Stop background server
kill $(lsof -t -i:5173)
```

## Important Notes

- The WSL IP address changes on restart
- Always use `host: true` for WSL2 development
- File watching may be slower due to WSL2 filesystem boundary
- Consider using VS Code with WSL Remote extension for better integration