var muted = false;
var mus = true;
var clickSound = new Audio('./sounds/click.ogg');
var ouchSound = new Audio('./sounds/ouch.ogg');
var gameOverSound = new Audio('./sounds/oof.ogg');
var music = new Audio('./sounds/SynthwaveD.mp3');
music.loop=true;
var bounds = [0, 0, 0, 0]; /* left top right bottom */
var clickEvent = 'mousedown';
var circleSize = 70;
var score = -1;
var highscore = 0;
var spawnTime = 1000;
var shrinkTime = 2000;
var lives = 3;
var gameover = false;
var allCircles = $(".playArea").find(".circle");
var spawnTimeoutID;

function options() {
	//User input feedback
	click();

	//Determine if game over window or main menu window
	var optionsMenu = ".options_menu_button";
	var mainMenu = ".main_menu_button";
	if($(".fadeIn").hasClass("hide")) {
		optionsMenu += "2";
		mainMenu += "2";
	}

	//Show if hidden, hide if shown
	if($(optionsMenu).hasClass("hider")) {
		$(optionsMenu).removeClass("hider");
		$(mainMenu).removeClass("hider");
	} else {
		$(optionsMenu).addClass("hider");
		$(mainMenu).addClass("hider");
	}
};

function musicSwitch() {
	//User input feedback
	click();

	//Check music if enabled, uncheck if disabled
	if(!mus) {
		mus=true;
		$(".musChk").addClass('checked');
	}else{
		mus=false;
		music.pause();
		$(".musChk").removeClass('checked');
	}

	//Update prefs
	localStorage.setItem("music", mus);

	//Debug Statement
	console.log("music toggled");
}

function soundSwitch() {
	//Unmute/mute sound, update UI, unmute/mute music
	if(muted){
		muted = false;
		localStorage.setItem("sound", muted);
		$(".soundChk").addClass('checked');
		if(mus){
			$(".musChk").addClass('checked');
			music.play();
		}
	}else{
		muted = true;
		localStorage.setItem("sound", muted);
		$(".soundChk").removeClass('checked');
		$(".musChk").removeClass('checked');
		music.pause();
	}

	//User input feedback, will not play if sound disabled
	click();

	//Debug Statement
	console.log("sound toggled");
}

function click() {
	soundHandler(clickSound, 0);
}

function soundHandler(soundName, int) {
	//Check for music input, if music and music disabled, then unplayable
	var playable = true;
	if(soundName == music && !mus) {
		playable = false;
	}
	//If sound enabled, play/restart/pause given sound
	if(!muted && playable){
		if(int == 0) {
			soundName.play();
		}
		else if(int == 1) {
			soundName.currentTime = 0;
			soundName.play();
		}
		else {
			soundName.pause();
		}
	}
}

function getBounds(rect) {
	//Get bounds of given rect, return array of [minx, miny, maxx, maxy]
	//Used to get play area for spawning circles
	const nrect = rect[0].getBoundingClientRect();
	bounds[0] = nrect["x"];
	bounds[1] = nrect["y"];
	bounds[2] = nrect["right"] - circleSize;
	bounds[3] = nrect["bottom"] - circleSize;
}

function loadPreferences() {
	if(localStorage.getItem("sound") == null) {
		localStorage.setItem("sound", muted);
	}
	if (localStorage.getItem("music") == null) {
		localStorage.setItem("music", mus);
	}
	if (localStorage.getItem("highscore") == null) {
		localStorage.setItem("highscore", highscore);
	}
	muted = JSON.parse(localStorage.getItem("sound"));
	if(muted == true) {
		$(".soundChk").removeClass('checked');
	} else {
		$(".soundChk").addClass('checked');
	}
	mus = JSON.parse(localStorage.getItem("music"));
	if(mus == true) {
		$(".musChk").addClass('checked');
	} else {
		$(".musChk").removeClass('checked');
	}
	highscore = JSON.parse(localStorage.getItem("highscore"));
	$("#hscore").text(highscore);
}

function initLives() {
	lives = 3;
	for(index = 0; index < lives; index++) {
		$("#lifeBar").append("<img class='life' src='./media/heart.png'/>");
	}
}

function updateLives() {
	lives -= 1;
	$(".life")[0].remove();
	if(lives <= 0) {
			gameOver();
	} else {
			soundHandler(ouchSound, 0);
	}
}

function updateScore(){
	score += 1;
	$("#score").text(score);
	if(score > highscore) {
		highscore = score;
		localStorage.setItem("highscore", highscore);
		$("#hscore").text(highscore);
	}
}

function updateSpawnTime() {
	if (spawnTime > 700) {
		spawnTime -= 10;
	} else if (spawnTime > 500) {
		spawnTime -= 5;
	} else if (spawnTime > 300) {
		spawnTime -= 2;
	} else {
		spawnTime -= 1;
	}
}

function clickCircle( circ ){
	click();
	updateScore();
	$(circ).stop();
	circ.remove();
	updateSpawnTime();
	allCircles = $(".playArea").find(".circle");
}

function deleteAllCircles() {
	for (index = 0; index < allCircles.length; index++) {
		allCircles[index].remove();
	}
	allCircles = $(".playArea").find(".circle");
}

function randCoords() {
	const xcord = Math.floor(Math.random() * (bounds[2] - bounds[0] + 1)) + bounds[0];
	const ycord = Math.floor(Math.random() * (bounds[3] - bounds[1] + 1)) + bounds[1];
	return [xcord, ycord];
}

function createCircle() {

	var new_circle = document.createElement('div');
	new_circle.className = "circle";
	new_circle.addEventListener(clickEvent, () => { clickCircle(new_circle) });
	$(".playArea").append(new_circle);

	//const for handling timeout issues
	const timeOut = Date.now() + 400;

	//While loop used to find usable coords for circle to spawn
	while(true) {
		const coords = randCoords();
		var overlapCheck = false;
		new_circle.style.left = coords[0] + "px";
		new_circle.style.top = coords[1] + "px";
		for (index = 0; index < allCircles.length; index++) {
			const circ = allCircles[index].getBoundingClientRect();
			const new_circ = new_circle.getBoundingClientRect();
			overlapCheck = !(circ.right < new_circ.left ||
				circ.left > new_circ.right ||
				circ.bottom < new_circ.top ||
				circ.top > new_circ.bottom)
			if(overlapCheck){
				break;
			}
		}

		//No overlap found, new circle can be spawned at generated coordinates
		if(!overlapCheck) {
			break;
		}

		//Function taking too long, probably no space on screen, timeout
		if(timeOut < Date.now())
		{
			//No more circles are spawned, game will end
			new_circle.remove();
			$(".life").remove();
			gameOver();
			return;
		}
	}
	console.log("Creating circle");
	allCircles = $(".playArea").find(".circle");
	$(new_circle).animate({
		left: "+=11",
		top: "+=11",
		width: "-=22",
		height: "-=22",
		opacity: 0.3
	}, shrinkTime, "linear", function() {
		updateLives();
		new_circle.remove();
		allCircles = $(".playArea").find(".circle");
	});

	spawnTimeoutID = window.setTimeout(createCircle, spawnTime);
}

function gameOver() {
	clearTimeout(spawnTimeoutID);
	gameover= true;
	allCircles.stop();
	deleteAllCircles();
	$(".overMenu").addClass("show");
	soundHandler(music, -1);
	soundHandler(gameOverSound, 0);
	$(".overMenuCover").animate({
		opacity: 0
	}, 1200 , "linear", function() {
		$(".overMenuCover").addClass("hide");
		$(".overMenuCover").css({opacity: 1});
	});
}
function gameStart() {
	const rect = $(".playArea");
	getBounds(rect);
	updateScore();
	initLives();
	createCircle();
	soundHandler(music, 1);
}

function restartGame() {
	click();
	score = -1;
	updateScore();
	initLives();
	gameover = false;
	spawnTime = 1000;
	$(".overMenu").removeClass("show");
	$(".overMenuCover").removeClass("hide");
	soundHandler(music, 1);
	createCircle();
}

function playGame() {
	click();
	$(".gameWindow").addClass('vis');
	$(".fadeIn").addClass("hide");
	gameStart();
}

function mainMenu() {
	click();
	score = -1;
	gameover = false;
	spawnTime = 1000;
	$(".overMenu").removeClass("show");
	$(".overMenuCover").removeClass("hide");
	$(".gameWindow").removeClass('vis');
	$(".fadeIn").removeClass("hide");
}

$(document).ready(function(){
	loadPreferences();

	//If mobile, use touchstart instead of mousedown
	if('ontouchstart' in document.documentElement) {
		clickEvent = 'touchstart';

	}
	//If desktop add hover effect for menus
	else {
		$('a').hover(
			function(){ $(this).addClass('hover') },
			function(){ $(this).removeClass('hover') }
		)
	}

	$(".fadeIn").addClass("load");
	$(".nav_button").on('click', options);
	$(".sound_button").on('click', soundSwitch);
	$(".music_button").on('click', musicSwitch);
	$("#play_button").on('click', playGame);
	$("#restart_button").on('click', restartGame);
	$("#main_menu_button").on('click', mainMenu);
});
