///<reference path="../../../_references.ts" /> 
angular.module("webglApp")
    .directive("terrainCanvas", function () {
    function link(scope, element, attrs) {
        //------------------------------------------------------
        // Some globally shared variables
        //------------------------------------------------------
        // global variables
        var MAX_HEIGHT = 6;
        var renderer;
        var scene;
        var camera;
        var control;
        var stats;
        var scale = chroma.scale(['blue', 'green', 'red']).domain([0, MAX_HEIGHT]);
        //------------------------------------------------------
        // Set up the main scene
        //------------------------------------------------------
        /**
         * Initializes the scene, camera and objects. Called when the window is
         * loaded by using window.onload (see below)
         */
        function init() {
            var windowWidth = $(".panel-body").width();
            var windowHeight = screen.availHeight - 400;
            // create a scene, that will hold all our elements such as objects, cameras and lights.
            scene = new THREE.Scene();
            // create a camera, which defines where we're looking at.
            camera = new THREE.PerspectiveCamera(45, windowWidth / windowHeight, 0.1, 1000);
            // create a render, sets the background color and the size
            renderer = new THREE.WebGLRenderer();
            renderer.setClearColor(0x000000, 1.0);
            renderer.setSize(windowWidth, windowHeight);
            renderer.shadowMapEnabled = true;
            // position and point the camera to the center of the scene
            camera.position.x = 40;
            camera.position.y = 40;
            camera.position.z = 50;
            camera.lookAt(scene.position);
            // add spotlight for the shadows
            var spotLight = new THREE.SpotLight(0xffffff);
            spotLight.position.set(10, 100, 10);
            scene.add(spotLight);
            scene.add(new THREE.AmbientLight(0x252525));
            // setup the control object for the control gui
            control = new function () {
                this.toFaceMaterial = function () {
                    var mesh = scene.getObjectByName('terrain');
                    var mat = new THREE.MeshLambertMaterial();
                    mat.vertexColors = THREE.FaceColors;
                    mat.shading = THREE.NoShading;
                    mesh.material = mat;
                };
                this.toNormalMaterial = function () {
                    var mesh = scene.getObjectByName('terrain');
                    var mat = new THREE.MeshNormalMaterial();
                    mesh.material = mat;
                };
                this.smoothShading = false;
                this.onSmoothShadingChange = function () {
                    var material = scene.getObjectByName('terrain').material;
                    var geom = scene.getObjectByName('terrain').geometry;
                    if (this.object.smoothShading) {
                        material.shading = THREE.SmoothShading;
                    }
                    else {
                        material.shading = THREE.NoShading;
                    }
                    material.needsUpdate = true;
                    geom.normalsNeedUpdate = true;
                };
            };
            // add the control gui and the stats UI
            //addControlGui(control);
            //addStatsObject();
            // add the output of the renderer to the html element
            //document.body.appendChild(renderer.domElement);
            d3.select(element[0]).node().appendChild(renderer.domElement);
            // set up the example specific stuff
            create3DTerrain(80, 80, 3, 3, MAX_HEIGHT);
            // call the render function, after the first render, interval is determined
            // by requestAnimationFrame
            render();
        }
        //------------------------------------------------------
        // Functions specific to this example
        //------------------------------------------------------
        function create3DTerrain(width, depth, spacingX, spacingZ, height) {
            // first create all the individual vertices
            var geometry = new THREE.Geometry();
            for (var z = 0; z < depth; z++) {
                for (var x = 0; x < width; x++) {
                    var vertex = new THREE.Vector3(x * spacingX, Math.random() * height, z * spacingZ);
                    geometry.vertices.push(vertex);
                }
            }
            // next we need to define the faces. Which are triangles
            // we create a rectangle between four vertices, and we do
            // that as two triangles.
            for (var z = 0; z < depth - 1; z++) {
                for (var x = 0; x < width - 1; x++) {
                    // we need to point to the position in the array
                    // a - - b
                    // |  x  |
                    // c - - d
                    var a = x + z * width;
                    var b = (x + 1) + (z * width);
                    var c = x + ((z + 1) * width);
                    var d = (x + 1) + ((z + 1) * width);
                    var face1 = new THREE.Face3(b, a, c);
                    var face2 = new THREE.Face3(c, d, b);
                    face1.color = new THREE.Color(scale(getHighPoint(geometry, face1)).hex());
                    face2.color = new THREE.Color(scale(getHighPoint(geometry, face2)).hex());
                    geometry.faces.push(face1);
                    geometry.faces.push(face2);
                }
            }
            // compute the normals
            geometry.computeVertexNormals(true);
            geometry.computeFaceNormals();
            // setup the material
            var mat = new THREE.MeshPhongMaterial();
            mat.vertexColors = THREE.FaceColors;
            mat.shading = THREE.NoShading;
            // create the mesh
            var groundMesh = new THREE.Mesh(geometry, mat);
            groundMesh.translateX(-width / 1.5);
            groundMesh.translateZ(-depth / 4);
            groundMesh.name = 'terrain';
            scene.add(groundMesh);
        }
        function getHighPoint(geometry, face) {
            var v1 = geometry.vertices[face.a].y;
            var v2 = geometry.vertices[face.b].y;
            var v3 = geometry.vertices[face.c].y;
            return Math.max(v1, v2, v3);
        }
        //------------------------------------------------------
        // Main render loop
        //------------------------------------------------------
        /**
         * Called when the scene needs to be rendered. Delegates to requestAnimationFrame
         * for future renders
         */
        function render() {
            // update the camera
            //        var rotSpeed = control.rotationSpeed;
            //        camera.position.x = camera.position.x * Math.cos(rotSpeed) + camera.position.z * Math.sin(rotSpeed);
            //        camera.position.z = camera.position.z * Math.cos(rotSpeed) - camera.position.x * Math.sin(rotSpeed);
            //        camera.lookAt(scene.position);
            // update stats
            //stats.update();
            // and render the scene
            renderer.render(scene, camera);
            // render using requestAnimationFrame
            requestAnimationFrame(render);
        }
        //------------------------------------------------------
        // Some generic helper functions
        //------------------------------------------------------
        /**
         * Create the control object, based on the supplied configuration
         *
         * @param controlObject the configuration for this control
         */
        function addControlGui(controlObject) {
            var gui = new dat.GUI({ autoPlace: false });
            gui.add(controlObject, 'toFaceMaterial');
            gui.add(controlObject, 'toNormalMaterial');
            gui.add(controlObject, 'smoothShading').onChange(controlObject.onSmoothShadingChange);
            gui.domElement.style.position = 'relative';
            d3.select(element[0]).node().appendChild(gui.domElement);
        }
        /**
         * Add the stats object to the top left border
         */
        function addStatsObject() {
            stats = new Stats();
            stats.setMode(0);
            stats.domElement.style.position = 'relative';
            d3.select(element[0]).node().appendChild(stats.domElement);
        }
        /**
         * Function handles the resize event. This make sure the camera and the renderer
         * are updated at the correct moment.
         */
        function handleResize() {
            var windowWidth = $(".panel-body").width();
            var windowHeight = screen.availHeight - 400;
            camera.aspect = windowWidth / windowHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(windowWidth, windowHeight);
        }
        //------------------------------------------------------
        // Init the scene and register the resize handler
        //------------------------------------------------------
        // calls the init function when the window is done loading.
        //window.onload = init;
        // calls the handleResize function when the window is resized
        //window.addEventListener('resize', handleResize, false);
        init();
        handleResize();
        d3.select(window).on("resize", handleResize);
    }
    return {
        link: link,
        restrict: 'E',
        replace: false,
        templateUrl: 'app/components/directives/terraincanvas/terraincanvas_template.html',
        scope: {}
    };
});
//# sourceMappingURL=terraincanvas.js.map