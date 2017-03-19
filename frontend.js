$(function () {
    "use strict";

    // for better performance - to avoid searching in DOM
    var count = $('#count');
    var input = $('#input');
    var status = $('#status');
    var riddle = $('#riddle');
    var riddleData = {};

    var score;
    if (localStorage && localStorage.score) {
		score = JSON.parse(localStorage.score);
		$('#score > h2').text(score);
	} else {
		score = 0;
	}

    // if user is running mozilla then use it's built-in WebSocket
    window.WebSocket = window.WebSocket || window.MozWebSocket;

    // if browser doesn't support WebSocket, just show some notification and exit
    if (!window.WebSocket) {
        count.html($('<p>', { text: 'Sorry, but your browser doesn\'t '
                                    + 'support WebSockets.'} ));
        input.hide();
        $('span').hide();
        return;
    }

    // open connection
    var connection = new WebSocket('ws://192.168.0.9:1337'); //192.168.0.6 //10.16.36.148

    connection.onopen = function () {
        // first we want users to enter their names
        input.removeAttr('disabled');
        status.text('Enter answer:');
    };

    connection.onerror = function (error) {
        // just in there were some problems with conenction...
        count.html($('<p>', { text: 'Sorry, but there\'s some problem with your '
                                    + 'connection or the server is down.' } ));
    };

    // most important part - incoming messages
    connection.onmessage = function (message) {
        try {
            var json = JSON.parse(message.data);
        } catch (e) {
            console.log('This doesn\'t look like a valid JSON: ', message.data);
            return;
        }
        console.log(message);
		if (json.type === 'count') { 
   		 	updateCount(json.data);
	 	} else if (json.type === 'history') { 
	 		createSpheres(json.data);

   		} else if (json.type === 'newSphere') { 
   		 	updateCount(json.data.count);
   		 	addSphere(json.data);
   		 	console.log(json.data.score)

	 	} else if (json.type === 'dropSphere') { 
	 		addSphere(json.data);

   		} else {
            console.log('Hmm..., I\'ve never seen JSON like this: ', json);
        }
    };

	function detectswipe(el,func) {
	  var swipe_det = new Object();
	  swipe_det.sX = 0; swipe_det.sY = 0; swipe_det.eX = 0; swipe_det.eY = 0;
	  var min_x = 30;  //min x swipe for horizontal swipe
	  var max_x = 30;  //max x difference for vertical swipe
	  var min_y = 50;  //min y swipe for vertical swipe
	  var max_y = 60;  //max y difference for horizontal swipe
	  var direc = "";
	  var ele = document.getElementById(el);
	  ele.addEventListener('touchstart',function(e){
	    var t = e.touches[0];
	    swipe_det.sX = t.screenX; 
	    swipe_det.sY = t.screenY;
	  },false);
	  ele.addEventListener('touchmove',function(e){
	    e.preventDefault();
	    var t = e.touches[0];
	    swipe_det.eX = t.screenX; 
	    swipe_det.eY = t.screenY;    
	  },false);
	  ele.addEventListener('touchend',function(e){
	    //horizontal detection
	    if ((((swipe_det.eX - min_x > swipe_det.sX) || (swipe_det.eX + min_x < swipe_det.sX)) && ((swipe_det.eY < swipe_det.sY + max_y) && (swipe_det.sY > swipe_det.eY - max_y) && (swipe_det.eX > 0)))) {
	      if(swipe_det.eX > swipe_det.sX) direc = "r";
	      else direc = "l";
	    }
	    //vertical detection
	    else if ((((swipe_det.eY - min_y > swipe_det.sY) || (swipe_det.eY + min_y < swipe_det.sY)) && ((swipe_det.eX < swipe_det.sX + max_x) && (swipe_det.sX > swipe_det.eX - max_x) && (swipe_det.eY > 0)))) {
	      if(swipe_det.eY > swipe_det.sY) direc = "d";
	      else direc = "u";
	    }

	    if ((direc != "d") && (direc != "")) {
	      if(typeof func == 'function') func(el,direc);
	    }
	    direc = "";
	    swipe_det.sX = 0; swipe_det.sY = 0; swipe_det.eX = 0; swipe_det.eY = 0;
	  },false);  
	}

	detectswipe('mobile', checkInput);

    setInterval(function() {
        if (connection.readyState !== 1) {
            status.text('Error');
            input.attr('disabled', 'disabled').val('Unable to comminucate '
                                                 + 'with the WebSocket server.');
        }
    }, 3000);

    /* Update count */
    function updateCount(c) {
        count.html('<p>'+ c +'</p>');
    }

	/* Check input against answer */
    function checkInput(el, dir){
    	var answer = input.val()
    		.toLowerCase()
    		.replace(/\s/g, '');
    	var riddleA = riddleData.answer
    		.toLowerCase()
    		.replace(/\s/g, '');
    	if (answer.includes(riddleA)){
    		//update user score
    		if (localStorage) {
   		 		score++;
   		 		$('#score > h2').text(score);
				localStorage.score = JSON.stringify(score);
			}
    		// send the message as an ordinary text
            connection.send(score);
            input.val('');
            status.text('Right!');
            getRiddle();
     
    	} else {
    		connection.send(false);
			console.log('the answer is wrong');
			status.text('Wrong...');
		}
    }

    /* Get a new riddle */
    function getRiddle(){
		var xhr = $.ajax({
			type: 'GET',
			url: "http://laurawarr.ca/riddles.php",
			cache: false
		});

		xhr.done(function(data){
			riddleData = JSON.parse(xhr.responseText);
			console.log(riddleData);
			setTimeout(function(){
				riddle.text(riddleData.question);
				status.text('Enter answer:');
			}, 500);
		});
	}
	getRiddle();


	/*
	THREE JS 
	*/
		// SCENE
		var scene;
		if (( Modernizr.touchevents ) && ( Modernizr.devicemotion,deviceorientation )) {
			// Mobile device
	
		} else {
		  // Not mobile device, then create scene
			scene = new THREE.Scene();
		};//
		
		// CAMERA
		var SCREEN_WIDTH = window.innerWidth, SCREEN_HEIGHT = window.innerHeight;
		var VIEW_ANGLE = 70, ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT, NEAR = 0.1, FAR = 200000;
		var camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);

		scene.add(camera);
		camera.position.set(600,600, 600);
		camera.lookAt(scene.position);
		
		// RENDERER
		if (Detector.webgl)
			var renderer = new THREE.WebGLRenderer({antialias:true});
		else
			var renderer = new THREE.CanvasRenderer(); 

		renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
		document.body.appendChild(renderer.domElement);

		// EVENTS
		THREEx.WindowResize(renderer, camera);
		THREEx.FullScreen.bindKey({charCode : 'm'.charCodeAt(0)});

		// SKYBOX
		var skyBoxGeometry = new THREE.CubeGeometry(100000, 100000, 100000);
		var skyBoxMaterial = new THREE.MeshBasicMaterial({color: 0x000000, side:THREE.BackSide});
		var skyBox = new THREE.Mesh(skyBoxGeometry, skyBoxMaterial);
		scene.add(skyBox);

		//TEXTURE 

		var loader = new THREE.TextureLoader();
		var texture = loader.load("images/line.png");
		texture.wrapS = texture.wrapT = THREE.RepeatWrapping; 
		texture.repeat.set(1, 1);

		// MATERIAL
		var circleMat = new THREE.MeshBasicMaterial( {map: texture, color: 0xffffff, transparent: true, opacity: 1} );

		// var circleMat = new THREE.MeshNormalMaterial( );
		circleMat.side = THREE.DoubleSide;

		// CREATE SPHERES
		var particles = new THREE.Group();
		particles.name = "particles";
		scene.add(particles);

		var animateInGroup = new THREE.Group();
		animateInGroup.name = "animateInGroup";
		scene.add(animateInGroup);

		var rad = 500;
		var angleS = [], angleT = [];

		function createSpheres(array){

			for (var i = 0; i < array.length; i++){

				addSphere(array[i])
			};
		}

		function dropSphere(obj){
			// var s = obj.angleS;
	  //   	var t = obj.angleT;
			// // MESH
			// var mesh = new THREE.Mesh( circleGeo, circleMat );

			// // Push object to a group objects to be animated and store properties in array
			// mesh.position.x = camera.position.x + 10;//610;
			// mesh.position.z = camera.position.z;//600;
			// mesh.position.y = camera.position.y - 10;//590;
			// var temp = {
			// 	'mesh': mesh,
			// 	'angles': obj,
			// 	'moving': true,
			// 	'elapsed': 0,
			// 	'drop': obj.drop
			// }
			// animateIn.push(temp);
			// animateInGroup.add(mesh);
		}

	    function addSphere(obj){

	    	var s = obj.angleS;
	    	var t = obj.angleT;

	    	// GEOMETRY
			var circleGeo = new THREE.SphereGeometry( 5 , 32 , 32 ); //+ obj.score
			console.log(obj.score)

			// MESH
			var mesh = new THREE.Mesh( circleGeo, circleMat );

			// Push object to a group objects to be animated and store properties in array
			mesh.position.x = camera.position.x + 10;//610;
			mesh.position.z = camera.position.z;//600;
			mesh.position.y = camera.position.y - 10;//590;
			var temp = {
				'mesh': mesh,
				'angles': obj,
				'moving': true,
				'elapsed': 0,
				'drop': obj.drop
			}
			animateIn.push(temp);
			animateInGroup.add(mesh);
	    }
		
		// LIGHT
		var light = new THREE.PointLight(0xffffff);
		light.position.set(100,250,100);
		scene.add(light);
		
		// CONTROLS
		var controls = new THREE.OrbitControls(camera, renderer.domElement);
		// controls.maxDistance = 2000;
		var keyboard = new KeyboardState();

		// ANIMATION	
		var counter = 0;
		var r;
		var animateIn = [];


		function animate() {

			// POSITION
			counter += 0.002;

			// Spin camera view
			// camera.position.y = Math.cos( counter ) * 600;
		 //    camera.position.z = Math.sin( counter ) * 600;
		 //    camera.lookAt( scene.position );

		
			r = rad/4 + Math.abs((3*rad/4) * Math.sin(counter));

			for (var i = 0; i < particles.children.length; i++){
				var p = particles.children[i].position;
				var a = angleT[i];
				var b = angleS[i];

				// SPHERE
				// p.x = r * Math.cos(angleT[i] + counter) * Math.sin(angleS[i]);
				// p.y = r * Math.sin(angleT[i] + counter) * Math.sin(angleS[i]);
				// p.z = r * Math.cos(angleS[i]);

				// SMILEY
				// var smileyX = [2 * (Math.cos(a)), Math.cos(a/2), -1 + Math.cos(a)/10, 1 + Math.cos(a)/10];
				// var smileyY = [2 * (Math.sin(a)), -Math.sin(a/2), 1 + Math.sin(a)/10, 1 + Math.sin(a)/10];

				// var f = i%4;
				// p.x = Math.abs(r/2)*smileyX[f];
				// p.y = Math.abs(r/2)*smileyY[f];
				// p.z = 1;

				// HEART
				// var heartX = 16*Math.pow(Math.sin(a), 3);
				// var heartY = 13*Math.cos(a) - 5*Math.cos(2*a) - 2*Math.cos(3*a) - Math.cos(4*a);

				// p.x = Math.abs(r/15)*heartX;
				// p.y = Math.abs(r/15)*heartY;
				// p.z = 1;

				// STAR
				// var starX = (2*Math.sin(3*a)*Math.cos(a));
				// var starY = (2*Math.sin(3*a)*Math.sin(a));
				// var starZ = Math.sin(3*a);

				// p.x = Math.abs(r/5)*starX;
				// p.y = Math.abs(r/5)*starY;
				// p.z = Math.abs(r/5)*starZ;

				// ASTEROID

				// var asteroidX = Math.pow(Math.cos(a), 3);
				// var asteroidY = Math.pow(Math.sin(a), 3);

				// p.x = Math.abs(r/5)*asteroidX;
				// p.y = Math.abs(r/5)*asteroidY;
				// p.z = 1;


				// DONUT
				var R = r/2;

				var donutX = Math.cos(a)*(r + R*Math.cos(b));
				var donutY = Math.sin(a)*(r + R*Math.cos(b));
				var donutZ = R*Math.sin(b);

				p.x = donutX;
				p.y = donutY;
				p.z = donutZ;

			}

			// ANIMATE TRAJECTORY ON ENTRY
			for (var i = 0; i < animateInGroup.children.length; i++){
				var speed = 20;
				animateIn[i].elapsed += 0.01;
				
				var object = animateIn[i].mesh;
				var s = animateIn[i].angles.angleS;
				var t = animateIn[i].angles.angleT;
				var startX = object.position.x, startY = object.position.y, startZ = object.position.z;

				var endX = r * Math.cos(t + counter) * Math.sin(s);
				var endY = r * Math.sin(t + counter) * Math.sin(s);
				var endZ = r * Math.cos(s);

				// On starting movement
				var distance = Math.sqrt(Math.pow(endX-startX,2)+Math.pow(endY-startY,2)+Math.pow(endZ-startZ,2));
				var directionX = (endX-startX) / distance;
				var directionY = (endY-startY) / distance;
				var directionZ = (endZ-startZ) / distance;
			
				// On update
				if(animateIn[i].moving == true){

				    object.position.x += directionX * speed * animateIn[i].elapsed;
				    object.position.y += directionY * speed * animateIn[i].elapsed;
				    object.position.z += directionZ * speed * animateIn[i].elapsed;

				   if (distance <= 10){
				   		if (animateIn[i].drop == false){

					        object.position.x = endX;
					        object.position.y = endY;
					        object.position.z = endZ;

					        animateIn[i].moving = false;
					        particles.add(animateIn[i].mesh);
					        angleT.push(t);
							angleS.push(s);

					        animateInGroup.remove(animateIn[i].mesh);
					        animateIn.splice(i, 1);
					    } else {
					    	object.position.x = endX;
					        object.position.y = endY;
					        object.position.z = endZ;

					        animateIn[i].moving = false;

					        animateInGroup.remove(animateIn[i].mesh);
					        animateIn.splice(i, 1);
					    }

				    }
				}
			}

		    requestAnimationFrame(animate);
		 
			controls.update();
			renderer.render(scene,camera);
			// cube.rotation.y += 0.01;

		};

		animate();
	// }; //end touchevent
});