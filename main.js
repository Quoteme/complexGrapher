var scaler = 1;
var c = document.getElementById("colorCanvas");
var ctx = c.getContext("2d");
var camera, scene, renderer, plane;
var mesh;

init();
animate();

function init() {
    camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 1000 );
    camera.position.z = 125;
    camera.position.y = 75;
    scene = new THREE.Scene();
    //
    var geometry = new THREE.TorusGeometry( 1, 0.5, 8, 20 );
    var material = new THREE.MeshBasicMaterial( { color: 0xffffff } );
    mesh = new THREE.Mesh( geometry, material );
    mesh.rotateX(-math.pi/2);
    scene.add( mesh );
    //
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );
    controls = new THREE.OrbitControls( camera, renderer.domElement );
    controls.enableKeys=false;
    //
    window.addEventListener( 'resize', onWindowResize, false );
    //
    display(evalFunction("z^2","z"));
}
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}
function animate() {
    requestAnimationFrame( animate );
    renderer.render( scene, camera );
}

function evalFunction(f,p) {
    /*
     *  this function takes in a function as a string and evaluates this function
     *  for all the points specified in the range the function should be plotted.
     *  as a result, this function returns an array full of complex numbers and
     *  their result when passed into the function f.
     *
     *  p is the parameter (ie. "z") for the function f (ie. "z^2")
    */
    // stores the highest and lowest points of the (plotted) graph
    var extremes = {
        "re":{"top":0, "btm":0},
        "im":{"top":0, "btm":0}
    }
    // takes in a string that represents a function ("x^2"||f) and replaces the parameter ("z"||p) with a number for each point
    var from = parseFloat(document.getElementById("from").value);
    var to = parseFloat(document.getElementById("to").value);
    var step = parseFloat(document.getElementById("step").value);
    var totalSteps = math.ceil((to-from)/step);

    var results = new Array();

    // calculate all the results the function gives for each complex number as an input
    for (var i = 0; i < totalSteps; i++) {
        results[i] = new Array();
        for (var j = 0; j < totalSteps; j++) {
            var ti = i*step+from;
            var tj = j*step+from;
            // replace the parameter of the function passed in as "f" with a number
            var tmp = f.replace(p,"("+ti+"+"+tj+"i"+")");
            var res = math.eval(tmp);
            // find highest and lowest points
            if (res.re > extremes.re.top) {
                extremes.re.top = res.re;
            }else if (res.re < extremes.re.btm) {
                extremes.re.btm = res.re;
            }else if (res.im > extremes.im.top) {
                extremes.im.top = res.im;
            }else if (res.im < extremes.im.btm) {
                extremes.im.btm = res.im;
            }
            // evaluate what the function equals to at this point
            results[i][j] = {"o":math.complex(ti,tj), "v": res};
        }
    }
    return [results,extremes];
}
function display(e) {
    console.log(e[1]);
    var from = parseFloat(document.getElementById("from").value);
    var to = parseFloat(document.getElementById("to").value);
    var step = parseFloat(document.getElementById("step").value);
    var totalSteps = math.floor((to-from)/step);
    //
    // remove any previous meshes/plots of functions
    scene.remove(plane);
    //
    // create a new mesh to plot the function to
    var geometry = new THREE.PlaneGeometry( 100, 100, totalSteps-1, totalSteps-1);
    var material = new THREE.MeshBasicMaterial( {side: THREE.DoubleSide, /*wireframe: true*/} );
    plane = new THREE.Mesh( geometry, material );
    plane.rotateX(-math.pi/2);
    plane.rotateZ(+math.pi/2);
    //
    // move the plane vertecies depending on their complex values
    for (var i = 0; i < plane.geometry.vertices.length; i++) {
        // console.log(i, math.floor(i/totalSteps), i%totalSteps, totalSteps);
        plane.geometry.vertices[i].z = e[0][math.floor(i/totalSteps)][i%totalSteps].v[document.getElementById("switched").checked?"im":"re"] * scaler;
        // plane.geometry.vertices[i].y = 1;
    }
    // draw the complex numbers that cannot be displayed in 3D, as colors on a canvas and apply this canvas to the mesh
    c.width = c.height = totalSteps;
    ctx.fillRect(0,0,c.width,c.height);
    for (var x = 0; x < totalSteps; x++) {
        for (var y = 0; y < totalSteps; y++) {
            var tmp = HSVtoRGB(
                !document.getElementById("switched").checked?
                    math.percentage(e[0][y][x].v.im, e[1].im.btm,e[1].im.top)*0.9:
                    math.percentage(e[0][y][x].v.re, e[1].re.btm,e[1].re.top)*0.9,
                1,1
            );
            ctx.fillStyle = "rgb("+tmp.r+","+tmp.g+","+tmp.b+")";
            ctx.fillRect(x,y,1,1);
        }
    }
    material.map = new THREE.CanvasTexture(c);
    material.map.needsUpdate = true;
    // add the new mesh to the scene
    scene.add( plane );
}

function renderButtonClicked() {
    display(evalFunction(document.getElementById('f').value,'z'));
}
function scalerChanged() {
    document.getElementById('scalerShow').innerHTML = scaler = math.pow(math.e,parseFloat(document.getElementById("scalerZ").value)/30)-0.9;
    renderButtonClicked();
}
function resetScaler() {
    document.getElementById('scalerZ').value = document.getElementById('scalerShow').innerHTML = scaler = 1;
    renderButtonClicked();
}

function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}
function HSVtoRGB(h, s, v) {
    /* accepts parameters
     * h  Object = {h:x, s:y, v:z}
     * OR
     * h, s, v
    */
    //
    // 0 <= h, s, v <= 1
    //
    var r, g, b, i, f, p, q, t;
    if (arguments.length === 1) {
        s = h.s, v = h.v, h = h.h;
    }
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
    };
}

// Fast Function switching
// document.onkeypress = function (e) {
//     e = e || window.event;
//     var f = document.getElementById("f");
//     var rb = document.getElementById("renderButton");
//     if (e.code.indexOf("Digit")!=-1) {
//         f.value = "x^"+e.code.charAt(e.code.length-1);
//         rb.click();
//     }
// };
