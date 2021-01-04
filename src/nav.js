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
	soundHandler(clickSound, 0);;

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
	soundHandler(clickSound, 0);;

	//Check music if enabled, uncheck if disabled
	if(!mus) {
		mus=true;
		$(".musChk").addClass('checked');
	}else{
		mus=false;
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
	}else{
		muted = true;
		localStorage.setItem("sound", muted);
		$(".soundChk").removeClass('checked');
	}

	//User input feedback, will not play if sound disabled
	soundHandler(clickSound, 0);;

	//Debug Statement
	console.log("sound toggled");
}
async function musicHandler(musicName, int) {
	//If music enabled, play/restart/pause given music
	if(mus && int) {
		musicName.currentTime = 0;
		musicName.play();
	} else {
		musicName.pause();
	}
}

async function soundHandler(soundName) {
	//If sound enabled, play sound
	if(!muted){
		soundName.play();
	}
}

function getBounds() {
	//Get bounds of given rect, return array of [minx, miny, maxx, maxy]
	//Used to get play area for spawning circles
	const rect = $(".playArea");
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

function initVars() {
	score = -1;
	gameover = false;
	spawnTime = 1000;
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
	soundHandler(clickSound, 0);;
	updateScore();
	$(circ).stop();
	circ.remove();
	updateSpawnTime();
	allCircles = $(".playArea").find(".circle");
}

function deleteAllCircles() {
	clearTimeout(spawnTimeoutID);
	allCircles.stop();
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

async function createCircle() {

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
	gameover= true;
	deleteAllCircles();
	musicHandler(music, 0);
	soundHandler(gameOverSound, 0);
	$(".overMenu").addClass("show");
	$(".overMenuCover").addClass("hide");
}
function gameStart() {
	getBounds();
	initVars();
	updateScore();
	initLives();
	createCircle();
	musicHandler(music, 1);
}

function restartGame() {
	soundHandler(clickSound, 0);;
	$(".overMenu").removeClass("show");
	$(".overMenuCover").removeClass("hide");
	gameStart();
}

function playGame() {
	soundHandler(clickSound, 0);;
	$(".gameWindow").addClass('vis');
	$(".fadeIn").addClass("hide");
	gameStart();
}

function mainMenu() {
	soundHandler(clickSound, 0);;
	$(".overMenu").removeClass("show");
	$(".overMenuCover").removeClass("hide");
	$(".gameWindow").removeClass('vis');
	$(".fadeIn").removeClass("hide");
}

function credits() {
	soundHandler(clickSound, 0);;
	$(".credits").toggleClass("show");
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
	$(".toggleCredits").on('click', credits);
});
