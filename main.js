var scaler = 1;
var c = document.getElementById("colorCanvas");
var ctx = c.getContext("2d");
var camera, scene, renderer, plane, gridX, gridY, gridZ;
var mesh;
var orthoscaler = 3;
init();
animate();

function init() {
    camera = new THREE.OrthographicCamera( window.innerWidth / - orthoscaler, window.innerWidth / orthoscaler, window.innerHeight / orthoscaler, window.innerHeight / - orthoscaler, 1, 1000 )
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
            var ti = i*step+from+step;
            var tj = j*step+from+step;
            // check if the function is a "special" function, which uses functions presently not availeable in math.js
            if (f.indexOf("riemannZeta")!=-1) {
                var tmp = math.riemannZeta(math.complex(ti,tj),100)
                var res = tmp;
                // console.log(math.complex(ti,tj),res);
            }else {
                // functions that can be calculated using math.js are passed in here
                // replace the parameter of the function passed in as "f" with a number
                var tmp = f.replace(p,"("+ti+"+"+tj+"i"+")");
                var res = math.eval(tmp);
            }
            // restrict the height of the graph, if the user defined so
            if (document.getElementById("restrictZ").checked) {
                var rtop = parseFloat(document.getElementById("restrictTop").value);
                var rbtm = parseFloat(document.getElementById("restrictBtm").value);
                if (res.re > rtop || res.re < rbtm ) {
                    res.re = 100*math.sign(res.re);
                }
                if (res.im > rtop || res.im < rbtm) {
                    res.im = 100*math.sign(res.im);
                }
            }
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
    console.log("Maxima & Minima: ",e[1]);
    var from = parseFloat(document.getElementById("from").value);
    var to = parseFloat(document.getElementById("to").value);
    var step = parseFloat(document.getElementById("step").value);
    var totalSteps = math.floor((to-from)/step);
    //
    // remove any previous meshes/plots of functions
    scene.remove(plane);
    scene.remove(gridX);
    scene.remove(gridY);
    scene.remove(gridZ);
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
        plane.geometry.vertices[i].z = e[0][math.floor(i/totalSteps)][i%totalSteps].v[document.getElementById("switched").checked?"im":"re"] * scaler*10;
        // plane.geometry.vertices[i].y = 1;
    }
    // draw the complex numbers that cannot be displayed in 3D, as colors on a canvas and apply this canvas to the mesh
    c.width = c.height = totalSteps;
    ctx.fillRect(0,0,c.width,c.height);
    for (var x = 0; x < totalSteps; x++) {
        for (var y = 0; y < totalSteps; y++) {
            if (document.getElementById("switched").checked) {
                var hue = math.percentage(e[0][y][x].v.re, e[1].re.btm,e[1].re.top)*0.9;
            }else {
                var hue = math.percentage(e[0][y][x].v.im, e[1].im.btm,e[1].im.top)*0.9;
            }

            ctx.fillStyle = "hsl("+360*hue+",100%,50%)";
            ctx.fillRect(x,y,1,1);
        }
    }
    material.map = new THREE.CanvasTexture(c);
    material.map.needsUpdate = true;
    // add a coordinate grid to the scene
    gridX = new THREE.GridHelper( 100, to-from );
    scene.add( gridX );
    gridY = new THREE.GridHelper( 100, to-from );
    gridY.rotateZ(-math.pi/2);
    scene.add( gridY );
    gridZ = new THREE.GridHelper( 100, to-from );
    gridZ.rotateX(-math.pi/2);
    scene.add( gridZ );
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
function gridbutton() {
    gridX.material.visible=document.getElementById("gridX").checked;
    gridY.material.visible=document.getElementById("gridY").checked;
    gridZ.material.visible=document.getElementById("gridZ").checked;
}

function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
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
