sudo apt-get install xvfb
xvfb-run --auto-servernum --server-args='-screen 0 1024x768x24' node main.js
