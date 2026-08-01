const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8995;
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const FRAMES_DIR = path.join(PUBLIC_DIR, 'frames');

if (!fs.existsSync(FRAMES_DIR)) {
  fs.mkdirSync(FRAMES_DIR, { recursive: true });
}

const server = http.createServer((req, res) => {
  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <!DOCTYPE html>
      <html>
      <body>
        <video id="v" src="/videos/swift.mp4" muted playsinline style="display:none;"></video>
        <canvas id="c"></canvas>
        <script>
          const video = document.getElementById('v');
          const canvas = document.getElementById('c');
          const ctx = canvas.getContext('2d');
          
          window.extractFrames = async (totalFrames = 60) => {
            await new Promise(r => {
              if (video.readyState >= 2) r();
              else video.onloadedmetadata = r;
            });
            
            canvas.width = video.videoWidth || 1280;
            canvas.height = video.videoHeight || 720;
            const duration = video.duration || 5;
            const frames = [];

            for (let i = 0; i < totalFrames; i++) {
              const time = (i / (totalFrames - 1)) * duration;
              video.currentTime = time;
              await new Promise(r => { video.onseeked = r; });
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              frames.push(canvas.toDataURL('image/jpeg', 0.85));
            }
            return frames;
          };
        </script>
      </body>
      </html>
    `);
  } else {
    const filePath = path.join(PUBLIC_DIR, req.url.replace(/^\//, ''));
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath);
      const mime = ext === '.mp4' ? 'video/mp4' : 'text/plain';
      res.writeHead(200, { 'Content-Type': mime });
      fs.createReadStream(filePath).pipe(res);
    } else {
      res.writeHead(404);
      res.end();
    }
  }
});

server.listen(PORT, async () => {
  console.log(`Extracting frames on port ${PORT}...`);

  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const edgeProc = spawn(edgePath, [
    '--headless',
    '--disable-gpu',
    '--remote-debugging-port=9225',
    `http://localhost:${PORT}/`
  ]);

  setTimeout(async () => {
    try {
      const jsonRes = await fetch('http://localhost:9225/json');
      const tabs = await jsonRes.json();
      const tab = tabs.find(t => t.url.includes(`localhost:${PORT}`));

      if (!tab || !tab.webSocketDebuggerUrl) {
        console.error('Failed to find CDP tab URL');
        process.exit(1);
      }

      const ws = new globalThis.WebSocket(tab.webSocketDebuggerUrl);

      ws.onopen = () => {
        ws.send(JSON.stringify({
          id: 1,
          method: 'Runtime.evaluate',
          params: {
            expression: 'window.extractFrames(60)',
            awaitPromise: true,
            returnByValue: true
          }
        }));
      };

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id === 1 && msg.result && msg.result.result) {
          const frames = msg.result.result.value;
          console.log(`Received ${frames.length} frames from Edge! Writing to disk...`);

          frames.forEach((dataUrl, idx) => {
            const base64Data = dataUrl.replace(/^data:image\/jpeg;base64,/, '');
            const frameNum = String(idx + 1).padStart(4, '0');
            const fileName = `frame_${frameNum}.jpg`;
            const filePath = path.join(FRAMES_DIR, fileName);
            fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
          });

          console.log(`✅ Saved ${frames.length} frames to ${FRAMES_DIR}!`);
          ws.close();
          edgeProc.kill();
          server.close();
          process.exit(0);
        }
      };
    } catch (err) {
      console.error('Extraction error:', err);
      edgeProc.kill();
      server.close();
      process.exit(1);
    }
  }, 3000);
});
