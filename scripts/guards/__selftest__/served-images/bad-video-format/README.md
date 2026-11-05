`ffmpeg -hide_banner -loglevel error -y -f lavfi -i testsrc=size=64x64:rate=10 -t 0.2 -c:v libvpx-vp9 -crf 50 -b:v 0 -an`. Fails: video-format (only MP4 is served).
