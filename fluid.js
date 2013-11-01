



//var SPRINGSTRENGTH = 0.5;
var SPRINGGAMMA = 0.03;
var SPRINGALPHA = 0.3; // 0.3
var SPRINGK = 0.3; // 0.3
var STIFFNESSPARAMETER = 0.04;  // k // 0.004
var STIFFNESSPARAMETERNEAR = 0.1;  // k near // 0.01
var RESTDENSITY = 2;  // p0 // 10
var GRAVITY = 0.1;
var FPS = 2;
var TIMESTEP = 1/FPS;

var VISCOSITYSIGMA = 0.004;
var VISCOSITYBETA = 0.04;

////////////////////////////////////////////////
// METABALLS //
////////////////////////////////////////////////
var handle_len_rate = 2.4;
var circlePaths = [];
var metaballOn = false;
var connections = new Group();
var metaballMaxDistance = 150;
var metaballV = 0.5;

var particleCircleRadius = 2;

var showSpringPaths = true;
var showNeighborPaths = false;
var debugcells = false;
var debugcheckParticle = false;

var numParticles = 64;
var particles = {};
var cells = [];
var springs = [];
var neighbors = [];

var interactionRadius = 32;
var gridSize = interactionRadius;
var gridNumX, gridNumY;

var checkParticle = 10; // 'tracer bullet'
var Xboundaries = [];
var Yboundaries = [];
var canvasWidth = 400;
var canvasHeight = 300;
var NEIGHBORLIST = [ [-1,-1] , [ 0,-1] , [ 1,-1] ,
										 [-1, 0] , [ 0, 0] , [ 1, 0] ,
										 [-1, 1] , [ 0, 1] , [ 1, 1] ];


//   ______  __    __  ______  ________ 
//  |      \|  \  |  \|      \|        \
//   \$$$$$$| $$\ | $$ \$$$$$$ \$$$$$$$$
//    | $$  | $$$\| $$  | $$     | $$   
//    | $$  | $$$$\ $$  | $$     | $$   
//    | $$  | $$\$$ $$  | $$     | $$   
//   _| $$_ | $$ \$$$$ _| $$_    | $$   
//  |   $$ \| $$  \$$$|   $$ \   | $$   
//   \$$$$$$ \$$   \$$ \$$$$$$    \$$   
//                                      
//                                      
//                                      

function init(){
	console.log('starting init');

	gridNumX = Math.ceil(canvasWidth/gridSize);
	gridNumY = Math.ceil(canvasHeight/gridSize);

	for (var i=0; i<numParticles; i++){
		particles[i] = new Particle(Math.random()*canvasWidth/2, Math.random()*canvasHeight, i);
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

//    ______   ________  ________  _______  
//   /      \ |        \|        \|       \ 
//  |  $$$$$$\ \$$$$$$$$| $$$$$$$$| $$$$$$$\
//  | $$___\$$   | $$   | $$__    | $$__/ $$
//   \$$    \    | $$   | $$  \   | $$    $$
//   _\$$$$$$\   | $$   | $$$$$   | $$$$$$$ 
//  |  \__| $$   | $$   | $$_____ | $$      
//   \$$    $$   | $$   | $$     \| $$      
//    \$$$$$$     \$$    \$$$$$$$$ \$$      
//                                          
//                                          
//                                          

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

function onFrame(event){
	console.log(event.count);

	findNeighbors();

	applyGravity();

	//updateNeighbors();

	applyViscosity();
	
	updateParticles();

	adjustSprings();

	applySpringDisplacements();

	//resolveCollisions();

	doubleDensityRelaxation();

	//predictVelocity();

	if (metaballOn === true){
		generateConnections(circlePaths);
	}
}

function findNeighbors()
{
	//console.log(neighbors);
	neighbors = [];
	//console.log(neighbors);
	for (i in particles)
	{
		particles[i].findNeighbors();
	}
}

function applyGravity()
{
	for (i in particles)
	{
		particles[i].vy += TIMESTEP*GRAVITY;
	}
}

function updateNeighbors()
{
	for (i in neighbors)
	{
		neighbors[i].update();
	}
}

function applyViscosity()
{
	for (i in neighbors)
	{
		neighbors[i].applyViscosity();
	}
}

function updateParticles()
{
	for (i in particles)
	{
		particles[i].update();
	}
}

function adjustSprings()
{
	for (i in neighbors)
	{
		neighbors[i].adjustSprings();
	}
}

function applySpringDisplacements()
{
	for (i in springs)
	{
		springs[i].update();
		springs[i].render();
	}
}

function resolveCollisions()
{
	console.log('resolving collisions');
}

function doubleDensityRelaxation()
{
	for (var i=0; i<numParticles; i++)
	{
		particles[i].calcNeighborQuants();
		particles[i].doubleDensityRelaxation();
	}
}

function predictVelocity()
{
	for (var i=0; i<numParticles; i++)
	{
		particles[i].predictVelocity();
	}
}


//   _______    ______   _______   ________  ______   ______   __        ________ 
//  |       \  /      \ |       \ |        \|      \ /      \ |  \      |        \
//  | $$$$$$$\|  $$$$$$\| $$$$$$$\ \$$$$$$$$ \$$$$$$|  $$$$$$\| $$      | $$$$$$$$
//  | $$__/ $$| $$__| $$| $$__| $$   | $$     | $$  | $$   \$$| $$      | $$__    
//  | $$    $$| $$    $$| $$    $$   | $$     | $$  | $$      | $$      | $$  \   
//  | $$$$$$$ | $$$$$$$$| $$$$$$$\   | $$     | $$  | $$   __ | $$      | $$$$$   
//  | $$      | $$  | $$| $$  | $$   | $$    _| $$_ | $$__/  \| $$_____ | $$_____ 
//  | $$      | $$  | $$| $$  | $$   | $$   |   $$ \ \$$    $$| $$     \| $$     \
//   \$$       \$$   \$$ \$$   \$$    \$$    \$$$$$$  \$$$$$$  \$$$$$$$$ \$$$$$$$$
//                                                                                
//                                                                                
//      

function Particle(x, y, i){
	this.x = x;
	this.y = y;

	this.point = new Point(this.x, this.y);

	this.px = 0;
	this.py = 0;

	//this.vx = Math.random()*10-5;
	//this.vy = Math.random()*10-5;
	this.vx = 0;
	this.vy = 0;

	this.v = new Point(this.vx, this.vy);

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
	this.rij = [];
	this.rijnorm = [];
	this.q = [];

	// attempting to avoid memory leaks
	this.checkCellHasMoved = false;
	this.viscosityux = 0;
	this.viscosityuy = 0;
	this.viscosityIx = 0;
	this.viscosityIy = 0;
	this.cellParticles;
	this.cellNeighbors;
	this._rij;
	this._rijnorm;
	this._q;
	this.dx;
	this.dy;
	this.Dx;
	this.Dy;

	this.spr;
	this.springAlreadyThere;

	this.circle = new Path.Circle(new Point(this.x,this.y), particleCircleRadius);
	this.circle.fillColor = 'blue'; //new Color(i/numParticles, 0, 1 - i/numParticles);
	circlePaths.push(this.circle);

	/*
	this.numTxt = new PointText(this.point);
	this.numTxt.justification = 'center';
	this.numTxt.fillColor = 'white';
	this.numTxt.content = this.i;
	*/

	this.update = function()
	{
		this.px = this.x;
		this.py = this.y;

		this.x += TIMESTEP * this.vx;
		this.y += TIMESTEP * this.vy;

		this.point.x = this.x;
		this.point.y = this.y;

		if (this.y > canvasHeight){
			this.y = canvasHeight;
			this.vy *= -0.5;
		}

		if (this.x < 0 || this.x > canvasWidth){
			if (this.x<0){
				this.x = 0;
			} else if (this.x>canvasWidth){
				this.x = canvasWidth;
			}
			this.vx *= -0.5;
		}

		
		if ( isNaN(this.x) || isNaN(this.y) ){
			console.log("particle " + this.i + " has gone NANANANANANAN!!!!!");
			console.log(this.i + ": " + this.x + ", " + this.y);
			console.log(this.i + ": " + this.vx + ", " + this.vy);
		}


		this.circle.position.x = this.x;
		this.circle.position.y = this.y;

		/*
		this.numTxt.position.x = this.x;
		this.numTxt.position.y = this.y;
		*/

		/*
		if (this.springs.length > 0){
			this.circle.fillColor = 'red';
		} else {
			this.circle.fillColor = 'blue';
		}
		*/

		this.checkCell();
	}


	this.checkCell = function()
	{
		this.checkCellHasMoved = false;
		for (var i=1; i<gridNumX; i++){ // can't cross 0 boundary
			if (this.x > Xboundaries[i] && this.px < Xboundaries[i]){
				
				cells[this.cell.x][this.cell.y].deleteParticle(this.i);
				this.cell.x = i;
				this.checkCellHasMoved = true;
			} else if (this.x < Xboundaries[i] && this.px > Xboundaries[i]){
				
				cells[this.cell.x][this.cell.y].deleteParticle(this.i);
				this.cell.x = i-1;
				this.checkCellHasMoved = true;
			}
		}

		for (var j=1; j<gridNumY; j++){ // can't cross 0 boundary
			if (this.y > Yboundaries[j] && this.py < Yboundaries[j]){
				
				cells[this.cell.x][this.cell.y].deleteParticle(this.i);
				this.cell.y = j;
				this.checkCellHasMoved = true;
			} else if (this.y < Yboundaries[j] && this.py > Yboundaries[j]){
				
				cells[this.cell.x][this.cell.y].deleteParticle(this.i);
				this.cell.y = j-1;
				this.checkCellHasMoved = true;
			}
		}

		if (this.checkCellHasMoved === true){
			cells[this.cell.x][this.cell.y].addParticle(this.i);
		}

		if (debugcheckParticle === true && this.i === checkParticle){
			cells[this.cell.x][this.cell.y].col = 'red';
			cells[this.cell.x][this.cell.y].sw = 5;
			cells[this.cell.x][this.cell.y].draw();
		}
	}


	this.predictVelocity = function()
	{
		//var svx = signum(this.vx);
		//var svy = signum(this.vy);
		this.vx = (this.x - this.px) / TIMESTEP;
		this.vy = (this.y - this.py) / TIMESTEP;
		//var svx2 = signum(this.vx);
		//var svy2 = signum(this.vy);
		//if (svx != svx2) this.vx *= -1;
		//if (svy != svy2) this.vy *= -1;
	}


	this.findNeighbors = function()
	{
		this.cellParticles = cells[this.cell.x][this.cell.y].particles;
		this.cellNeighbors = cells[this.cell.x][this.cell.y].neighbors;

		this.neighborParticleIndices = [];

		if (this.cellParticles != null){
			for (var it=0; it<this.cellParticles.length; it++){
				if (this.i != this.cellParticles[it]){
					this.neighborParticleIndices.push(this.cellParticles[it]);

					//neighbors.push( new Neighbors(this.i, this.cellParticles[it]) );
				}
			}
		}

		if (this.cellNeighbors != null){
			for (var i=0; i<this.cellNeighbors.length; i++){
				//var cn = cells[this.cellNeighbors[i][0]][this.cellNeighbors[i][1]];
				//var pcn = cn.particles;
				//if (pcn != null){
				if (cells[this.cellNeighbors[i][0]][this.cellNeighbors[i][1]].particles != null){
					for (var j=0; j<cells[this.cellNeighbors[i][0]][this.cellNeighbors[i][1]].particles.length; j++){
						if (this.i != cells[this.cellNeighbors[i][0]][this.cellNeighbors[i][1]].particles[j].i){
							this.neighborParticleIndices.push(cells[this.cellNeighbors[i][0]][this.cellNeighbors[i][1]].particles[j]);
							//neighbors.push( new Neighbors( this.i, cells[ this.cellNeighbors[i][0] ][ this.cellNeighbors[i][1] ].particles[j] ) );
						}
					}
				}
			}
		}

		/*
		if(this.i === checkParticle){
			console.log(this.neighborParticleIndices);
		}
		*/

		for (j in this.neighborParticleIndices)
		{
			// this.neighborParticleIndices[j]
			/*
			if(this.i === checkParticle){
				console.log(this.neighborParticleIndices[j]);
			}
			*/
			var I;
			var J;
			if (this.i < this.neighborParticleIndices[j])
			{
				I = this.i;
				J = this.neighborParticleIndices[j];
			}
			else 
			{
				I = this.neighborParticleIndices[j];
				J = this.i;
			}

			var neighborAlreadyThere = false;
			for (k in neighbors)
			{
				if ( (neighbors[k].i === I && neighbors[k].j === J) || (neighbors[k].i === J && neighbors[k].j === I) )
				{
					neighborAlreadyThere = true;
				}
			}

			if (neighborAlreadyThere === false)
			{
				//console.log('adding neighbor ' + I + ', ' + J);
				neighbors.push( new Neighbors(I, J) );
			}
		}

		/*
		if (this.i === checkParticle)
		{
			//console.log(this.i + " has " + this.neighborParticleIndices.length + " neighbors.");
			//console.log(this.neighborParticleIndices);
			var neighborPaths = [];
			if (this.neighborParticleIndices.length > 0)
			{	
				for (var ani = 0; ani < this.neighborParticleIndices.length; ani++)
				{
					var ptj = new Point(particles[this.neighborParticleIndices[ani]].x, particles[this.neighborParticleIndices[ani]].y);
					var p = new Path.Line(ptj, new Point(this.x, this.y));
					p.strokeColor = 'black';
					neighborPaths.push(p);
				}
			}
		}
		*/
		
	}

	
	this.calcNeighborQuants = function()
	{
		this.rij = [];
		this.q = [];

		for (var i=0; i<this.neighborParticleIndices.length; i++)
		{
			if (this.i < this.neighborParticleIndices[i])
			{
				this._rij = new Point(this.x - particles[this.neighborParticleIndices[i]].x, this.y - particles[this.neighborParticleIndices[i]].y);
			} 
			else if (this.neighborParticleIndices[i] < this.i)
			{
				this._rij = new Point(particles[this.neighborParticleIndices[i]].x - this.x, particles[this.neighborParticleIndices[i]].y -  this.y);
			}
			else 
			{
				console.log('somethings gone wrong with the quants');
			}
			
			this.rij.push(this._rij);
			this._rijnorm = this._rij.normalize();
			this.rijnorm.push(this._rijnorm);
			this._q = this._rij.length/interactionRadius;
			this.q.push(this._q);
			
			if (this.i === checkParticle){
				//console.log("this point: " + this.x + ", " + this.y);
				//console.log("neighbor index: " + this.neighborParticleIndices[i]);
				//console.log("neighbor point: " + particles[this.neighborParticleIndices[i]].x + ", " + particles[this.neighborParticleIndices[i]].y);
				//console.log("rij: " + this._rij.x + ", " + this._rij.y);
				//console.log("rijlen: " + this._rij.length );
				//console.log("rijnorm: " + this._rijnorm.x + ", " + this._rijnorm.y);
				//console.log('q: ' + this._q);
			}
			
		}
	}
	


	this.doubleDensityRelaxation = function()
	{
		if (this.i === checkParticle){
			//console.log("pre ddr: " + this.x + ", " + this.y);
		}

		this.density = 0;
		this.neardensity = 0;

		//this.findNeighbors();
		//this.calcNeighborQuants();

		for (i in this.neighborParticleIndices)
		{
			if (this.i === checkParticle){
				//console.log(this.q[i]);
			}
			if (this.q[i] < 1)
			{
				this.density += (1-this.q[i])*(1-this.q[i]);
				this.neardensity += (1-this.q[i])*(1-this.q[i])*(1-this.q[i]);
			}
			
		}

		this.pressure = STIFFNESSPARAMETER * (this.density - RESTDENSITY);
		this.nearpressure = STIFFNESSPARAMETERNEAR * this.neardensity;

		this.dx = 0;
		this.dy = 0;

		for (i in this.neighborParticleIndices)
		{
			
			if (this.q[i] < 1)
			{
				// D <- t sq 
				this.Dx = TIMESTEP * TIMESTEP * this.rij[i].length * ( ( this.pressure * (1-this.q[i]) ) + ( this.nearpressure * ( (1-this.q[i]) * (1-this.q[i]) ) ) ) * this.rijnorm[i].x;
				this.Dy = TIMESTEP * TIMESTEP * this.rij[i].length * ( ( this.pressure * (1-this.q[i]) ) + ( this.nearpressure * ( (1-this.q[i]) * (1-this.q[i]) ) ) ) * this.rijnorm[i].y;

				particles[this.neighborParticleIndices[i]].x += this.Dx/2;
				particles[this.neighborParticleIndices[i]].y += this.Dy/2;
				this.dx -= this.Dx/2; 
				this.dy -= this.Dy/2;
			}
		}

		this.x += this.dx;
		this.y += this.dy;

		if (this.i === checkParticle){
			//console.log("pos ddr: " + this.x + ", " + this.y);
		}
	}

	/*
	this.adjustSprings = function()
	{
		for (var i = 0; i < this.neighborParticleIndices.length; i++)
		{
			var jI = this.neighborParticleIndices[i];
			//var partj = particles[jI];
			//var ptj = new Point(partj.x, partj.y);
			//var rij = this.point.getDistance(ptj);
			//var q = rij/interactionRadius;
			if (this.q[i] < 1)
			{
				this.springAlreadyThere = false;
				this.spr = null;
				for (s in springs)
				{
					//console.log(springs[s]);
					if ( (springs[s].a === this.i && springs[s].b === jI) || ( springs[s].a === jI && springs[s].b === this.i ) ){
						//console.log('spring[' + s + '] is already connecting ' + this.i + ' and ' + jI);
						this.spr = springs[s];
						this.springAlreadyThere = true;
						break;
					}
				}

				if (this.springAlreadyThere === false)
				{
					this.spr = new Spring(this.i, jI, interactionRadius);
					springs.push(this.spr);
					this.springs.push(this.spr);
					particles[jI].springs.push(this.spr);
				}

				var d = SPRINGGAMMA * this.spr.restLength;

				if (this.rij[i].length > this.spr.restLength + d)
				{
					this.spr.restLength += SPRINGALPHA * (this.rij[i].length - this.spr.restLength - d);
				}
				else if (this.rij[i].length > this.spr.restLength - d)
				{
					this.spr.restLength -= SPRINGALPHA * (this.spr.restLength - d - this.rij[i].length);
				}
			}
		}

		this.checkSpringRestLength();
	}

	this.checkSpringRestLength = function()
	{
		if (this.springs.length > 0){
			for (s in this.springs){
				//console.log(this.springs[s]);
				if (this.springs[s] !== undefined)
				{
					//console.log(s + " restLength = " + this.springs[s].restLength);
					if (this.springs[s].restLength > interactionRadius || this.springs[s].rijlen > interactionRadius)
					{
						//console.log('removing spring ' + s + ' from particle ' + this.i + ' connecting ' + this.springs[s].a + ' and ' + this.springs[s].b);
						for (s2 in springs){
							if (springs[s2] !== undefined){
								if ( (springs[s2].a === this.springs[s].a && springs[s2].b === this.springs[s].b) || (springs[s2].a === this.springs[s].b && springs[s2].b === this.springs[s].a) ){
									//console.log('removing spring ' + s2 + ' from springs ' + ' connecting ' + this.springs[s].a + ' and ' + this.springs[s].b);
									springs[s2].removeSpring();
									springs.splice(s2, 1);
									//console.log('now what is in place of it: spring ' + s2 + ' connects ' + springs[s2].a + ' and ' + springs[s2].b);
								}
							}
						}

						var pind = particles[ this.springs[s].a !== this.i ? this.springs[s].a : this.springs[s].b ];
						pind.springs.splice( pind.springs.indexOf(this.springs[s]), 1 );
						this.springs.splice(s, 1);

					}
				}
			}
		}
	}
	*/
}


//   __    __  ________  ______   ______   __    __  _______    ______   _______    ______  
//  |  \  |  \|        \|      \ /      \ |  \  |  \|       \  /      \ |       \  /      \ 
//  | $$\ | $$| $$$$$$$$ \$$$$$$|  $$$$$$\| $$  | $$| $$$$$$$\|  $$$$$$\| $$$$$$$\|  $$$$$$\
//  | $$$\| $$| $$__      | $$  | $$ __\$$| $$__| $$| $$__/ $$| $$  | $$| $$__| $$| $$___\$$
//  | $$$$\ $$| $$  \     | $$  | $$|    \| $$    $$| $$    $$| $$  | $$| $$    $$ \$$    \ 
//  | $$\$$ $$| $$$$$     | $$  | $$ \$$$$| $$$$$$$$| $$$$$$$\| $$  | $$| $$$$$$$\ _\$$$$$$\
//  | $$ \$$$$| $$_____  _| $$_ | $$__| $$| $$  | $$| $$__/ $$| $$__/ $$| $$  | $$|  \__| $$
//  | $$  \$$$| $$     \|   $$ \ \$$    $$| $$  | $$| $$    $$ \$$    $$| $$  | $$ \$$    $$
//   \$$   \$$ \$$$$$$$$ \$$$$$$  \$$$$$$  \$$   \$$ \$$$$$$$   \$$$$$$  \$$   \$$  \$$$$$$ 
//                                                                                          
//                                                                                          
//                                                                                          

function Neighbors(i, j){
	this.i = i;
	this.j = j;

	this.particlei = particles[this.i];
	this.particlej = particles[this.j];

	this.pti = new Point(this.particlei.x, this.particlei.y);
	this.ptj = new Point(this.particlej.x, this.particlej.y);

	this.rij = new Point( (this.pti.x - this.ptj.x), (this.pti.y - this.ptj.y) );

	this.q = this.rij.length/interactionRadius;

	this.viscosityux;
	this.viscosityuy;

	this.viscosityIx;
	this.viscosityIy;

	this.springAlreadyThere;
	this.spr;
	this.d;

	this.other;

	if (this.i === checkParticle || this.j === checkParticle)
	{
		if (this.i === checkParticle)
		{
			this.other = this.j;
		}
		else if (this.j === checkParticle) 
		{
			this.other = this.i;
		} 
		else 
		{
			console.log('why is neighbor undefined?');
		}
	}

	this.update = function()
	{
		this.rij = this.pti - this.ptj;
		this.q = this.rij.length/interactionRadius;
		
	}

	this.applyViscosity = function()
	{
		if (this.q < 1)
		{
			this.viscosityux = (this.particlei.vx - this.particlej.vx) * this.rij.normalize().x;
			this.viscosityuy = (this.particlei.vy - this.particlej.vy) * this.rij.normalize().y;
			//console.log("u: " + this.viscosityux + ", " + this.viscosityuy);
			if (this.viscosityux > 0 || this.viscosityuy > 0)
			{
				this.viscosityIx = TIMESTEP * (1 - this.q) * (VISCOSITYSIGMA*this.viscosityux + VISCOSITYBETA*this.viscosityux*this.viscosityux) * this.rij.normalize().x;
				this.viscosityIy = TIMESTEP * (1 - this.q) * (VISCOSITYSIGMA*this.viscosityuy + VISCOSITYBETA*this.viscosityuy*this.viscosityuy) * this.rij.normalize().y;
				//console.log("I: " + this.viscosityIx + ", " + this.viscosityIy);
				
				this.particlei.vx -= this.viscosityIx/2;
				this.particlei.vy -= this.viscosityIy/2;

				this.particlej.vx += this.viscosityIx/2;
				this.particlej.vy += this.viscosityIy/2;
			}
		}
	}

	this.adjustSprings = function()
	{
		if (this.q < 1)
		{
			this.springAlreadyThere = false;
			this.spr = null;

			for (s in springs)
			{
				//console.log(springs[s]);
				if ( (springs[s].a === this.i && springs[s].b === this.j) || ( springs[s].a === this.j && springs[s].b === this.i ) ){
					//console.log('spring[' + s + '] is already connecting ' + this.i + ' and ' + this.j);
					this.spr = springs[s];
					this.springAlreadyThere = true;
					break;
				}
			}

			if (this.springAlreadyThere === false)
			{
				//console.log('creating a spring because springAlreadyThere is false');
				this.spr = new Spring(this.i, this.j, interactionRadius);
				springs.push(this.spr);
				//this.springs.push(this.spr);
				//particles[jI].springs.push(this.spr);
			}

			this.d = SPRINGGAMMA * this.spr.restLength;
			//onsole.log('d: ' + this.d);

			if (this.rij.length > this.spr.restLength + this.d)
			{
				this.spr.restLength += TIMESTEP * SPRINGALPHA * (this.rij.length - interactionRadius - this.d);
			}
			else if (this.rij.length > this.spr.restLength - this.d)
			{
				this.spr.restLength -= TIMESTEP * SPRINGALPHA * (interactionRadius - this.d - this.rij.length);
			}
		}
		//console.log(springs);
		this.checkSpringRestLength();
	}

	this.checkSpringRestLength = function()
	{
		//console.log(springs.length);
		for (s in springs){
			//console.log(springs[s]);
			if (springs[s] !== undefined)
			{
				//console.log(s + " restLength = " + springs[s].restLength + ", rijlen = " + springs[s].rijlen);
				if (springs[s].restLength > interactionRadius || springs[s].rijlen > interactionRadius*2)
				{
					//console.log('removing spring');
					springs[s].removeSpring();
					springs.splice(s, 1);	
				}
			}
		}

	}
}


//    ______   ________  __        __       
//   /      \ |        \|  \      |  \      
//  |  $$$$$$\| $$$$$$$$| $$      | $$      
//  | $$   \$$| $$__    | $$      | $$      
//  | $$      | $$  \   | $$      | $$      
//  | $$   __ | $$$$$   | $$      | $$      
//  | $$__/  \| $$_____ | $$_____ | $$_____ 
//   \$$    $$| $$     \| $$     \| $$     \
//    \$$$$$$  \$$$$$$$$ \$$$$$$$$ \$$$$$$$$
//                                          
//                                          
//                                          


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

//    ______   _______   _______   ______  __    __   ______  
//   /      \ |       \ |       \ |      \|  \  |  \ /      \ 
//  |  $$$$$$\| $$$$$$$\| $$$$$$$\ \$$$$$$| $$\ | $$|  $$$$$$\
//  | $$___\$$| $$__/ $$| $$__| $$  | $$  | $$$\| $$| $$ __\$$
//   \$$    \ | $$    $$| $$    $$  | $$  | $$$$\ $$| $$|    \
//   _\$$$$$$\| $$$$$$$ | $$$$$$$\  | $$  | $$\$$ $$| $$ \$$$$
//  |  \__| $$| $$      | $$  | $$ _| $$_ | $$ \$$$$| $$__| $$
//   \$$    $$| $$      | $$  | $$|   $$ \| $$  \$$$ \$$    $$
//    \$$$$$$  \$$       \$$   \$$ \$$$$$$ \$$   \$$  \$$$$$$ 
//                                                            
//                                                            
//                                                            

function Spring(a, b, restLength) {
  this.a = a;
  this.b = b;

  /*
  if (this.a === checkParticle || this.b === checkParticle){
  	console.log("sssssssssssssssssssssssssssssssss");
  	console.log("in spring creation");
  	console.log(this.a + ", " + this.b);
  	console.log(particles[this.a]);
  	console.log(isNaN(particles[this.a].x));
  	console.log("sssssssssssssssssssssssssssssssss");
  }
  */
  
  this.ptax = particles[this.a].x;
  this.ptay = particles[this.a].y;
  this.ptbx = particles[this.b].x;
  this.ptby = particles[this.b].y;

  this.pta = new Point(this.ptax, this.ptay);
  this.ptb = new Point(this.ptbx, this.ptby);
  //console.log(this.pta.x + ", " + this.pta.y);

  this.restLength = restLength;
  //this.strength = SPRINGSTRENGTH;
  this.rij = new Point( (this.ptax - this.ptbx), (this.ptay - this.ptby) );
  //this.mamb = values.invMass * values.invMass;
  this.Lij = this.restLength;
  this.rijnorm = this.rij.normalize();
  this.rijlen = this.rij.length;
  this.D;
  this.Dx;
  this.Dy;

  if (showSpringPaths === true){
  	//console.log('creating new spring path for spring: ' + this.a + " - " + this.b);
  	this.showPath = new Path.Line(this.pta, this.ptb);
  	this.showPath.strokeColor = 'red';
  }
  
  
  this.update = function()
  {
  	
  	this.ptax = particles[this.a].x;
  	this.ptay = particles[this.a].y;
  	this.ptbx = particles[this.b].x;
  	this.ptby = particles[this.b].y;
  	
  	this.pta.x = this.ptax;
  	this.pta.y = this.ptay;
  	this.ptb.x = this.ptbx;
  	this.ptb.y = this.ptby;
  	//this.ptb = particles[this.b].point;
  	this.rij.x = this.ptax - this.ptbx;
  	this.rij.y = this.ptay - this.ptby;

  	this.Lij = this.restLength;
  	this.rijnorm = this.rij.normalize();
  	this.rijlen = this.rij.length;
  	this.D = TIMESTEP * TIMESTEP * SPRINGK * (1 - (this.Lij/interactionRadius)) * (this.Lij - this.rijlen);
  	this.Dx = this.D * this.rijnorm.x;
  	this.Dy = this.D * this.rijnorm.y;

  	if ( isNaN(this.D) === false && isNaN(this.Dx) === false && isNaN(this.Dy) === false )
  	{
  		particles[this.a].x -= this.Dx/2;
	  	particles[this.a].y -= this.Dy/2;
	  	particles[this.b].x += this.Dx/2;
	  	particles[this.b].y += this.Dy/2;
  	}
  	else 
  	{
  		console.log('D has gone NANANANANANAN');
  	}
  	

  	if (showSpringPaths === true){
  		this.render();
  	}

  	/*
  	if (this.restLength > interactionRadius){
  		console.log('/////////////////////////////////');
  		console.log('// THIS SPRING ' + this.a + ' to ' + this.b + ' SHOULD BE GONE!!! //');
  		console.log('// IT IS ' + this.restLength + ' LONG //');
  		console.log('/////////////////////////////////');
  	}

  	if (this.rijlen > interactionRadius){
  		console.log('/////////////////////////////////');
  		console.log('// THIS SPRING ' + this.a + ' to ' + this.b + ' SHOULD BE GONE!!! //');
  		console.log('// IT IS ' + this.rijlen + ' LONG //');
  		console.log('/////////////////////////////////');
  	}
  	*/
  	
  }

  this.render = function(){
  	/*
  	if (this.a === checkParticle || this.b === checkParticle){
  		console.log("showPath: " + this.showPath);
  	}
  	*/
  	if (showSpringPaths === true){
	  	this.showPath.segments[0].point = this.pta;
	  	//this.showPath.segments[0].point.y = this.ptay;
	  	this.showPath.segments[1].point = this.ptb;
	  }
  	//this.showPath.segments[1].point.y = this.ptby;
  	//console.log(this.pta.x + ", " + this.pta.y);
  }

  this.removeSpring = function(){
  	if (showSpringPaths === true){
	  	//console.log('path from ' + this.a + ' to ' + this.b + ' should be removed');
	  	this.showPath.strokeColor = 'green';
	  	var hasIt = this.showPath.remove();
	  	this.showPath.remove();
	  	//console.log('has it? ' + hasIt);
	  }
  }
  /*
  this.acirc = new Path.Circle(this.a, 10);
  this.acirc.strokeColor = 'blue';
  this.bcirc = new Path.Circle(this.b, 10);
  this.bcirc.strokeColor = 'red';
  */
};


//   __       __  ________  ________   ______   _______    ______   __        __         ______  
//  |  \     /  \|        \|        \ /      \ |       \  /      \ |  \      |  \       /      \ 
//  | $$\   /  $$| $$$$$$$$ \$$$$$$$$|  $$$$$$\| $$$$$$$\|  $$$$$$\| $$      | $$      |  $$$$$$\
//  | $$$\ /  $$$| $$__       | $$   | $$__| $$| $$__/ $$| $$__| $$| $$      | $$      | $$___\$$
//  | $$$$\  $$$$| $$  \      | $$   | $$    $$| $$    $$| $$    $$| $$      | $$       \$$    \ 
//  | $$\$$ $$ $$| $$$$$      | $$   | $$$$$$$$| $$$$$$$\| $$$$$$$$| $$      | $$       _\$$$$$$\
//  | $$ \$$$| $$| $$_____    | $$   | $$  | $$| $$__/ $$| $$  | $$| $$_____ | $$_____ |  \__| $$
//  | $$  \$ | $$| $$     \   | $$   | $$  | $$| $$    $$| $$  | $$| $$     \| $$     \ \$$    $$
//   \$$      \$$ \$$$$$$$$    \$$    \$$   \$$ \$$$$$$$  \$$   \$$ \$$$$$$$$ \$$$$$$$$  \$$$$$$ 
//                                                                                               
//                                                                                               
//                                                                                               

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


function signum(x){
	return (x > 0) - (x < 0);
}

init();
