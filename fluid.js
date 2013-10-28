


/*

Simulation step:

for each particle i{
	apply gravity
	vi = vi + t*g

	apply viscosity
}

for each particle i {
	save previous position
	xiprev = xi

	advance to predicted position
	xi = xi + t*vi
}

adjust springs
	// modify positions according to springs
	// double density relaxation, and collisions

applySpringDisplacements
double Density Relaxation
resolveCollisions

for each particle i {
	use previous position to compute next velocity
	vi = (xi - xiprev)/t
}

*/
var SPRINGSTRENGTH = 0.05;
var SPRINGGAMMA = 0.1;
var SPRINGALPHA = 0.3;
var SPRINGK = 0.3;
var STIFFNESSPARAMETER = 0.004;  // k
var STIFFNESSPARAMETERNEAR = 0.01;  // k near
var RESTDENSITY = 10;  // p0
var GRAVITY = 0.5;
var TIMESTEP = 1;

////////////////////////////////////////////////
// METABALLS //
////////////////////////////////////////////////
var handle_len_rate = 2.4;
var circlePaths = [];
var metaballOn = false;
var connections = new Group();
var metaballMaxDistance = 150;
var metaballV = 0.5;

var particleCircleRadius = 20;

var numParticles = 20;
var particles = {};
var cells = [];
var springs = [];

var interactionRadius = 100;
var gridSize = interactionRadius;
var gridNumX, gridNumY;
var debugcells = false;
var debugcheckParticle = true;
var checkParticle = 10; // 'tracer bullet'
var Xboundaries = [];
var Yboundaries = [];
var canvasWidth = 1600;
var canvasHeight = 900;
var NEIGHBORLIST = [ [-1,-1] , [ 0,-1] , [ 1,-1] ,
										 [-1, 0] , [ 0, 0] , [ 1, 0] ,
										 [-1, 1] , [ 0, 1] , [ 1, 1] ];



function init(){
	console.log('starting init');

	gridNumX = Math.ceil(canvasWidth/gridSize);
	gridNumY = Math.ceil(canvasHeight/gridSize);

	for (var i=0; i<numParticles; i++){
		particles[i] = new Particle(Math.random()*canvasWidth, Math.random()*canvasHeight, i);
		if (debugcheckParticle === true && i === checkParticle){
			particles[i].circle.strokeColor = 'green';
		}
	}

	for (var i=0; i<gridNumX; i++){
		cells[i] = [];
		Xboundaries[i] = i * gridSize;
		for (var j=0; j<gridNumY; j++){
			Yboundaries[j] = j * gridSize;
			cells[i][j] = new Cell(i*gridSize, j*gridSize, i, j);
			//cells[i][j].draw();
			cells[i][j].setNeighbors();
		}
	}

	for (var i=0; i<numParticles; i++){
		var pi = particles[i];
		for (var m=0; m<cells.length; m++){
			for (var n=0; n<cells[m].length; n++){
				var isIn = cells[m][n].isInside(pi.x, pi.y);
				if (isIn === true){
					pi.cell.x = m;
					pi.cell.y = n;
					cells[m][n].addParticle(i);
					break;
				}
			}
		}
	}
}



function onFrame(event){
	
	if (event.count % TIMESTEP == 0){
		applyGravity();
	}

	//applyViscosity
	
	for (var i=0; i<numParticles; i++){
		particles[i].update();
	}

	adjustSprings();

	for (var i=0; i<springs.length; i++){
		var pta = new Point(particles[springs[i].a].x, particles[springs[i].a].y);
		var ptb = new Point(particles[springs[i].b].x, particles[springs[i].b].y);
		var p = new Path(pta, ptb);
		p.strokeColor = 'black';
		//springs[i].update();
	}

	doubleDensityRelaxation();

	predictVelocity();

	if (metaballOn === true){
		generateConnections(circlePaths);
	}
}



function applyGravity(){
	for (var i=0; i<numParticles; i++){
		particles[i].vy += GRAVITY;
	}
}

function predictVelocity(){
	for (var i=0; i<numParticles; i++){
		particles[i].predictVelocity();
	}
}

function doubleDensityRelaxation(){
	for (var i=0; i<numParticles; i++){
		particles[i].doubleDensityRelaxation();
	}
}

function adjustSprings(){
	for (var i=0; i<numParticles; i++){
		particles[i].adjustSprings();
	}
}

function applySpringDisplacements(){
	console.log('applying spring displacements');
}

function resolveCollisions(){
	console.log('resolving collisions');
}



function Particle(x, y, i){
	this.x = x;
	this.y = y;

	this.point = new Point(this.x, this.y);

	this.px = 0;
	this.py = 0;

	this.vx = Math.random()*10;
	this.vy = Math.random()*10;

	this.i = i;

	this.cell={
		x: 0,
		y: 0,
	};

	this.density = 0;
	this.neardensity = 0;

	this.pressure = 0;
	this.nearpressure = 0;

	this.neighborParticleIndices = [];
	this.springs = [];

	this.circle = new Path.Circle(new Point(x,y), particleCircleRadius);
	this.circle.fillColor = 'blue'; //new Color(i/numParticles, 0, 1 - i/numParticles);
	circlePaths.push(this.circle);

	this.update = function()
	{
		this.px = this.x;
		this.py = this.y;

		this.x += this.vx;
		this.y += this.vy;

		this.circle.position.x = this.x;
		this.circle.position.y = this.y;
		this.checkCell();
	}

	this.checkCell = function()
	{
		var hasMoved = false;
		for (var i=1; i<gridNumX; i++){ // can't cross 0 boundary
			if (this.x > Xboundaries[i] && this.px < Xboundaries[i]){
				
				cells[this.cell.x][this.cell.y].deleteParticle(this.i);
				this.cell.x = i;
				hasMoved = true;
			} else if (this.x < Xboundaries[i] && this.px > Xboundaries[i]){
				
				cells[this.cell.x][this.cell.y].deleteParticle(this.i);
				this.cell.x = i-1;
				hasMoved = true;
			}
		}

		for (var j=1; j<gridNumY; j++){ // can't cross 0 boundary
			if (this.y > Yboundaries[j] && this.py < Yboundaries[j]){
				
				cells[this.cell.x][this.cell.y].deleteParticle(this.i);
				this.cell.y = j;
				hasMoved = true;
			} else if (this.y < Yboundaries[j] && this.py > Yboundaries[j]){
				
				cells[this.cell.x][this.cell.y].deleteParticle(this.i);
				this.cell.y = j-1;
				hasMoved = true;
			}
		}

		if (hasMoved === true){
			cells[this.cell.x][this.cell.y].addParticle(this.i);
		}

		if (debugcheckParticle === true && this.i === checkParticle){
			var ci = cells[this.cell.x][this.cell.y];
			ci.col = 'red';
			ci.sw = 5;
			ci.draw();
		}
	}

	this.predictVelocity = function()
	{
		var svx = signum(this.vx);
		var svy = signum(this.vy);
		this.vx = (this.x - this.px);
		this.vy = (this.y - this.py);

		if (this.y > canvasHeight){
			this.y = canvasHeight;
			this.vy *= -1;
		}

		if (this.x < 0 || this.x > canvasWidth){
			if (this.x<0){
				this.x = 0;
			} else if (this.x>canvasWidth){
				this.x = canvasWidth;
			}
			this.vx *= -1;
		}
	}

	this.doubleDensityRelaxation = function()
	{
		if (this.i === checkParticle){
			console.log("pre ddr: " + this.x + ", " + this.y);
		}

		this.density = 0;
		this.neardensity = 0;

		var thisCellParticles = cells[this.cell.x][this.cell.y].particles;
		var thisCellNeighbors = cells[this.cell.x][this.cell.y].neighbors;

		this.neighborParticleIndices = [];

		if (thisCellParticles != null){
			for (var it=0; it<thisCellParticles.length; it++){
				if (this.i != thisCellParticles[it]){
					this.neighborParticleIndices.push(thisCellParticles[it]);
				}
			}
		}

		if (thisCellNeighbors != null){
			for (var i=0; i<thisCellNeighbors.length; i++){
				var cn = cells[ thisCellNeighbors[i][0] ][ thisCellNeighbors[i][1] ];
				var pcn = cn.particles;
				if (pcn != null){
					for (var j=0; j<pcn.length; j++){
						if (this.i != pcn[j].i){
							this.neighborParticleIndices.push(pcn[j]);
						}
					}
				}
			}
		}

		for (var ani = 0; ani < this.neighborParticleIndices.length; ani++)
		{
			var ptj = new Point(particles[this.neighborParticleIndices[ani]].x, particles[this.neighborParticleIndices[ani]].y);
			var rij = this.point.getDistance(ptj);
			var q = rij/interactionRadius;
			if (q < 1)
			{
				this.density += (1-q)*(1-q);
				this.neardensity += (1-q)*(1-q)*(1-q);
			}
		}

		this.pressure = STIFFNESSPARAMETER * (this.density - RESTDENSITY);
		this.nearpressure = STIFFNESSPARAMETER * this.neardensity;

		var dx = 0;

		for (var ani = 0; ani < this.neighborParticleIndices.length; ani++)
		{
			var partj = particles[this.neighborParticleIndices[ani]];
			var rij = this.point.getDistance(ptj);
			var q = rij/interactionRadius;
			if (q < 1)
			{
				// D <- t sq 
				var D = rij * ( this.pressure * (1-q) + this.nearpressure * (1-q) * (1-q) );
				partj.x += D/2;
				partj.y += D/2;
				dx -= D/2; 
			}
		}

		this.x += dx;
		this.y += dx;

		if (this.i === checkParticle)
		{
			var neighborPaths = [];
			if (this.neighborParticleIndices.length > 0)
			{
				console.log("pos ddr: " + this.x + ", " + this.y);
				console.log(this.neighborParticleIndices);
				console.log(this.i + " density: " + this.density);
				console.log(this.i + " ndensity: " + this.neardensity);
				console.log(this.i + " pressure: " + this.pressure);
				console.log(this.i + " npressure: " + this.nearpressure);
				
				for (var ani = 0; ani < this.neighborParticleIndices.length; ani++)
				{
					var ptj = new Point(particles[this.neighborParticleIndices[ani]].x, particles[this.neighborParticleIndices[ani]].y);
					var p = new Path.Line(ptj, new Point(this.x, this.y));
					p.strokeColor = 'black';
					neighborPaths.push(p);
				}
			}
			for (var anp = 0; anp < neighborPaths.length; anp++){
				neighborPaths[anp].remove();
			}
		}
	}

	this.adjustSprings = function()
	{
		for (var j = 0; j < this.neighborParticleIndices.length; j++)
		{
			var jI = this.neighborParticleIndices[j];
			var partj = particles[this.neighborParticleIndices[j]];
			var ptj = new Point(partj.x, partj.y);
			var rij = this.point.getDistance(ptj);
			var q = rij/interactionRadius;
			if (q < 1)
			{
				var alreadyThere = false;
				var spr;
				for (s in springs)
				{
					if ( (s.a === this.i && s.b === jI) || ( s.a === jI && s.b === this.i ) ){
						spr = s;
						alreadyThere = true;
						break;
					}
				}

				if (alreadyThere === false)
				{
					if (this.i < jI){
						spr = new Spring(this.i, j, interactionRadius);
					}
					else 
					{
						spr = new Spring(j, this.i, interactionRadius);
					}
					springs.push(spr);
					this.springs.push(spr);
				}

				var d = SPRINGGAMMA * spr.restLength;

				if (rij > spr.restLength + d)
				{
					spr.restLength += SPRINGALPHA * (rij - spr.restLength - d);
				}
				else if (rij > spr.restLength - d)
				{
					spr.restLength -= SPRINGALPHA * (spr.restLength - d - rij);
				}
			}
		}
	}

	for (s in this.springs){
		if (s.restLength > interactionRadius)
		{
			this.springs.splice(indexOf(s), 1);
			for (s2 in springs){
				if ( (s2.a === s.a && s2.b === s.b) || (s2.a === s.b && s2.b === s.a) ){
					springs.splice(indexOf(s2), 1);
				}
			}
		}
	}
}

function signum(x){
	return (x > 0) - (x < 0);
}

function Cell(x, y, i, j){
	this.x0 = x;
	this.y0 = y;
	this.x1 = x+gridSize;
	this.y1 = y+gridSize;
	this.particles = [];
	this.col = 'black';
	this.sw = 0.5;

	this.i = i;
	this.j = j;

	this.neighbors = [];

	this.path = new Path();
	if (debugcells === true || debugcheckParticle === true){
		this.path = new Path.Rectangle(new Point(this.x0, this.y0), new Point(this.x1, this.y1));
		this.path.strokeColor = this.col;
		this.path.strokeWidth = this.sw;
	}

	this.addParticle = function(particle){
		this.particles.push(particle);
	}

	this.deleteParticle = function(particle){
		if (debugcheckParticle === true && particle === checkParticle){
			this.col = 'black';
			this.sw = 0.5;
			this.draw();
			for (var i=0; i<this.neighbors.length; i++){
				var ni = this.neighbors[i];
				var ci = cells[ ni[0] ][ ni[1] ];
				ci.col = 'black';
				ci.sw = 0.5;
				ci.draw();
			}
		}
		var ind = this.particles.indexOf(particle);
		this.particles.splice(ind, 1);
	}

	this.draw = function(){
		this.path.strokeColor = this.col;
		this.path.strokeWidth = this.sw;
		if (debugcheckParticle === true && this.col === 'red'){
			for (var i=0; i<this.neighbors.length; i++){
				var ni = this.neighbors[i];
				var ci = cells[ ni[0] ][ ni[1] ];
				ci.col = 'orange';
				ci.sw = 3;
				ci.draw();
			}
		}
	}

	this.isInside = function(ix, iy){
		if (ix > this.x0 && ix < this.x1 && iy > this.y0 && iy < this.y1){
			return true;
		} else {
			return false;
		}
	}

	this.setNeighbors = function(){

		var isleftborder = false;
		var isrightborder = false;
		var istopborder = false;
		var isbottomborder = false;

		if (this.i === 0){
			isleftborder = true;
		} else if (this.i === gridNumX-1){
			isrightborder = true;
		}

		if (this.j === 0){
			istopborder = true;
		} else if (this.j === gridNumY-1){
			isbottomborder = true;
		}

		var n0 = [ NEIGHBORLIST[0][0] + this.i, NEIGHBORLIST[0][1] + this.j ];
		var n1 = [ NEIGHBORLIST[1][0] + this.i, NEIGHBORLIST[1][1] + this.j ];
		var n2 = [ NEIGHBORLIST[2][0] + this.i, NEIGHBORLIST[2][1] + this.j ];
		var n3 = [ NEIGHBORLIST[3][0] + this.i, NEIGHBORLIST[3][1] + this.j ];
		var n4 = [ NEIGHBORLIST[4][0] + this.i, NEIGHBORLIST[4][1] + this.j ];
		var n5 = [ NEIGHBORLIST[5][0] + this.i, NEIGHBORLIST[5][1] + this.j ];
		var n6 = [ NEIGHBORLIST[6][0] + this.i, NEIGHBORLIST[6][1] + this.j ];
		var n7 = [ NEIGHBORLIST[7][0] + this.i, NEIGHBORLIST[7][1] + this.j ];
		var n8 = [ NEIGHBORLIST[8][0] + this.i, NEIGHBORLIST[8][1] + this.j ];

		if (istopborder === false){
			if (isleftborder === false){
				this.neighbors.push( n0 );
			}
			this.neighbors.push( n1 );
			if (isrightborder === false){
				this.neighbors.push( n2 );
			}
		}
		if (isbottomborder === false){
			if (isleftborder === false){
				this.neighbors.push( n6 );
			}
			this.neighbors.push( n7 );
			if (isrightborder === false){
				this.neighbors.push( n8 );
			}
		}
		if (isleftborder === false){
			if (istopborder === false && this.neighbors.indexOf( n0 ) === -1){
				this.neighbors.push( n0 );
			}
			if (this.neighbors.indexOf( n3 ) === -1){
				this.neighbors.push( n3 );
			}
			if (isbottomborder === false && this.neighbors.indexOf( n6 ) === -1){
				this.neighbors.push( n6 );
			}
		}
		if (isrightborder === false){
			if (istopborder === false && this.neighbors.indexOf( n2 ) === -1){
				this.neighbors.push( n2 );
			}
			if (this.neighbors.indexOf( n5 ) === -1){
				this.neighbors.push( n5 );
			}
			if (isbottomborder === false && this.neighbors.indexOf( n8 ) === -1){
				this.neighbors.push( n8 );
			}
		}

		//console.log(this.i + ' , ' + this.j + ' neighbors: ' + this.neighbors);
	}
}

function Spring(a, b, restLength) {
  this.a = a;
  this.b = b;

  this.pta = new Point(particles[a].x, particles[a].y);
  this.ptb = new Point(particles[b].x, particles[b].y);

  this.restLength = restLength || 80;
  this.strength = SPRINGSTRENGTH;
  //this.mamb = values.invMass * values.invMass;
  
  this.acirc = new Path.Circle(this.a, 10);
  this.acirc.strokeColor = 'blue';
  this.bcirc = new Path.Circle(this.b, 10);
  this.bcirc.strokeColor = 'red';
};

Spring.prototype.update = function() {
  var delta = this.ptb - this.pta;
  var dist = delta.length;
  var normDistStrength = (dist - this.restLength) / dist * this.strength;
  //console.log("delta: " + delta);
  var delttest = delta;
  delta *= normDistStrength * 0.2;
  delttest *= normDistStrength * 0.2;
  //console.log("delttest: " + delttest);
  //console.log("deltax: " + delta.x + ", deltay: " + delta.y);
  
  if (!this.a.fixed){
    particles[this.a].x += delta.x;
    particles[this.a].y += delta.y;
  }
  if (!this.b.fixed){
    particles[this.b].x -= delta.x;
    particles[this.b].y -= delta.y;
  }
  
  this.acirc.position = this.a;
  this.bcirc.position = this.b;
};




function generateConnections(paths) {
	// Remove the last connection paths:
	connections.children = [];

	for (var i = 0, l = paths.length; i < l; i++) {
		for (var j = i - 1; j >= 0; j--) {
			var path = metaball(paths[i], paths[j], metaballV, handle_len_rate, metaballMaxDistance);
			if (path) {
				connections.appendTop(path);
				path.removeOnMove();
			}
		}
	}
}

function metaball(ball1, ball2, v, handle_len_rate, maxDistance) {
	var center1 = ball1.position;
	var center2 = ball2.position;
	var radius1 = ball1.bounds.width / 2;
	var radius2 = ball2.bounds.width / 2;
	var pi2 = Math.PI / 2;
	var d = center1.getDistance(center2);
	var u1, u2;

	if (radius1 == 0 || radius2 == 0)
		return;

	if (d > maxDistance || d <= Math.abs(radius1 - radius2)) {
		return;
	} else if (d < radius1 + radius2) { // case circles are overlapping
		u1 = Math.acos((radius1 * radius1 + d * d - radius2 * radius2) /
				(2 * radius1 * d));
		u2 = Math.acos((radius2 * radius2 + d * d - radius1 * radius1) /
				(2 * radius2 * d));
	} else {
		u1 = 0;
		u2 = 0;
	}

	var angle1 = (center2 - center1).getAngleInRadians();
	var angle2 = Math.acos((radius1 - radius2) / d);
	var angle1a = angle1 + u1 + (angle2 - u1) * v;
	var angle1b = angle1 - u1 - (angle2 - u1) * v;
	var angle2a = angle1 + Math.PI - u2 - (Math.PI - u2 - angle2) * v;
	var angle2b = angle1 - Math.PI + u2 + (Math.PI - u2 - angle2) * v;
	var p1a = center1 + getVector(angle1a, radius1);
	var p1b = center1 + getVector(angle1b, radius1);
	var p2a = center2 + getVector(angle2a, radius2);
	var p2b = center2 + getVector(angle2b, radius2);

	// define handle length by the distance between
	// both ends of the curve to draw
	var totalRadius = (radius1 + radius2);
	var d2 = Math.min(v * handle_len_rate, (p1a - p2a).length / totalRadius);

	// case circles are overlapping:
	d2 *= Math.min(1, d * 2 / (radius1 + radius2));

	radius1 *= d2;
	radius2 *= d2;

	var path = new Path({
		segments: [p1a, p2a, p2b, p1b],
		style: ball1.style,
		closed: true
	});
	var segments = path.segments;
	segments[0].handleOut = getVector(angle1a - pi2, radius1);
	segments[1].handleIn = getVector(angle2a + pi2, radius2);
	segments[2].handleOut = getVector(angle2b - pi2, radius2);
	segments[3].handleIn = getVector(angle1b + pi2, radius1);
	return path;
}

// ------------------------------------------------
function getVector(radians, length) {
	return new Point({
		// Convert radians to degrees:
		angle: radians * 180 / Math.PI,
		length: length
	});
}

init();
