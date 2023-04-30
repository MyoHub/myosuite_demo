# Run tests locally



1. Install emscripten
On MacOs:
```
brew install emscripten
```

2. Build the mujoco_wasm Binary

```bash
mkdir build
cd build
emcmake cmake ..
make
```
On Windows, run `build_windows.bat`.


In a terminal launch a server with

``` bash
python -m http.server
```
Open a browser and navigate to `https://localhost:8000`
