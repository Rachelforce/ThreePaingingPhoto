const gl = require("gl"); // https://npmjs.com/package/gl v4.9.0
const THREE = require("three"); // https://npmjs.com/package/three v0.124.0
const express = require('express');
const getPixels = require("get-pixels")
const {MeshBasicMaterial} = require("three");
const promises =   require("timers/promises");
const app=express();

const port=1337;

app.listen(1337,()=>{
    console.log('live on port '+port);
});
app.get('/test', function (req, res) {
    res.send("OK")
});
app.get('/',async function (req, res) {
    try {
        const img_url = req.query.img;
        const w = req.query.w;
        const h = req.query.h;
        const x = req.query.x;
        const y = req.query.y;
        const z = req.query.z;
        console.log(img_url);
        console.log(w);
        console.log(h);
        console.log(x);
        console.log(y);
        console.log(z);
        createScene(w, h, img_url, x, y, z).then((value) => {
            res.send(value);
        });
    }
    catch (error) {
        console.error(error);
        res.send("ERROR")
    }
});

 async function createScene(w, h, img_url,x,y,z) {
     let material, box,image;
     const scene = new THREE.Scene();
     console.log("Start")
     scene.background = new THREE.Color('#ffffff');
      getPixels(img_url, function (err, pixels) {

         var texture = new THREE.DataTexture(new Uint8Array(pixels.data), pixels.shape[0], pixels.shape[1], THREE.RGBAFormat);
         texture.needsUpdate = true;
         material = new MeshBasicMaterial({map: texture});
         box = new THREE.Mesh(new THREE.BoxGeometry(), material);
         box.scale.set(w, 0.015, h);
         box.castShadow = true;
         box.position.set(0, 0, 0);
         //box.castShadow = true;
         scene.add(box);

         const light = new THREE.PointLight();
         light.position.set(3, 3, 5);
         light.castShadow = true;
         scene.add(light);
          const axesHelper = new THREE.AxesHelper( 5 );
          scene.add( axesHelper );
         const camera = new THREE.PerspectiveCamera();
         camera.aspect = w/h;
          camera.updateProjectionMatrix();
         camera.up.set(0, 0, 1);
         camera.position.set(x, y, z);
         camera.lookAt(box.position);
         scene.add(camera);

         const renderer = createRenderer({width:  w/h*1000, height:1000});
         renderer.render(scene, camera);

          image = extractPixels(renderer.getContext());
         const d = new Date();
          console.log("loaded")
        // fs.writeFileSync(d.getTime() + ".ppm", toP3(image));
     });
     await promises.setTimeout(1500);
     console.log("END")
     return toP3(image);
 }

function createRenderer({height, width}) {
    // THREE expects a canvas object to exist, but it doesn't actually have to work.
    const canvas = {
        width,
        height,
        addEventListener: event => {},
        removeEventListener: event => {},
    };

    const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: false,
        powerPreference: "high-performance",
        context: gl(width, height, {
            preserveDrawingBuffer: true,
        }),
    });

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default PCFShadowMap

    // This is important to enable shadow mapping. For more see:
    // https://threejsfundamentals.org/threejs/lessons/threejs-rendertargets.html and
    // https://threejsfundamentals.org/threejs/lessons/threejs-shadows.html
    const renderTarget = new THREE.WebGLRenderTarget(width, height, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.NearestFilter,
        format: THREE.RGBAFormat,
        type: THREE.UnsignedByteType,
    });

    renderer.setRenderTarget(renderTarget);
    return renderer;
}

function extractPixels(context) {
    const width = context.drawingBufferWidth;
    const height = context.drawingBufferHeight;
    const frameBufferPixels = new Uint8Array(width * height * 4);
    context.readPixels(0, 0, width, height, context.RGBA, context.UNSIGNED_BYTE, frameBufferPixels);
    // The framebuffer coordinate space has (0, 0) in the bottom left, whereas images usually
    // have (0, 0) at the top left. Vertical flipping follows:
    const pixels = new Uint8Array(width * height * 4);
    for (let fbRow = 0; fbRow < height; fbRow += 1) {
        let rowData = frameBufferPixels.subarray(fbRow * width * 4, (fbRow + 1) * width * 4);
        let imgRow = height - fbRow - 1;
        pixels.set(rowData, imgRow * width * 4);
    }
    return {width, height, pixels};
}

function toP3({width, height, pixels}) {
    const headerContent = `P3\n${width} ${height}\n255\n`;
    const bytesPerPixel = pixels.length / width / height;

    let output = headerContent;
    for (let i = 0; i < pixels.length; i += bytesPerPixel) {
        for (let j = 0; j < 3; j += 1) {
            output += pixels[i + j] + " ";
        }
        output += "\n";
    }

    return output;
}