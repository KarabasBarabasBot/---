const MatrixRain = (() => {
  const canvas = document.getElementById('matrix-canvas');
  const ctx = canvas.getContext('2d');

  const CHARS =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()_+-=[]{}|;:,.<>?/\\~`' +
    'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ' +
    'アイウエオカキクケコサシスセソタチツテトナニヌネノ';

  let cols, drops;
  const FONT_SIZE = 14;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    cols = Math.floor(canvas.width / FONT_SIZE);
    drops = new Array(cols).fill(1);
  }

  function draw() {
    // Slightly transparent black overlay for trail effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = FONT_SIZE + 'px monospace';

    for (let i = 0; i < drops.length; i++) {
      const char = CHARS[Math.floor(Math.random() * CHARS.length)];
      const y = drops[i] * FONT_SIZE;

      // Bright leading character
      if (drops[i] * FONT_SIZE > canvas.height * 0.8 || Math.random() > 0.95) {
        ctx.fillStyle = '#fff';
      } else {
        // Gradient: bright green for recent, darker for older
        const brightness = Math.floor(150 + Math.random() * 105);
        ctx.fillStyle = `rgb(0, ${brightness}, 0)`;
      }

      ctx.fillText(char, i * FONT_SIZE, y);

      // Reset column when it goes off screen
      if (y > canvas.height && Math.random() > 0.975) {
        drops[i] = 0;
      }
      drops[i]++;
    }
  }

  let animId;
  function start() {
    resize();
    window.addEventListener('resize', resize);
    function loop() {
      draw();
      animId = requestAnimationFrame(loop);
    }
    loop();
  }

  return { start };
})();
