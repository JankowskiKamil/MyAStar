//import {myCheckedEvent, GetColsInput, GetRowsInput} from './events.js';

var gameStarted = false;
var gameFinished = false;

var showDetails = false;

var cols;
var rows;

var inputCols = 50;
var inputRows = 50;

var canvasHeight = 1000;
var canvasWidth = 800;

var wallPercentage = 0.3
var borderSize = 2;
var radiusScale = 1.1;

var grid 
var openList
var closedList
var start;
var end;
var allowDiagonalWallSkip = false;
var inputAllowDiagonalWallSkip = false;
var slider;

var w, h; //parameters needed for Spot dimensions
var path = [];

function heuristic(a, b) {
  //TODO diagonal vs normal step ?
  return abs(a.i - b.i) + abs(a.j - b.j);
  //return dist(a.i, a.j, b.i, b.j);
}

function removeFromArray(arr, node)
{
  var index = arr.indexOf(node);
  if (index > -1) {
    arr.splice(index, 1);
  }

}


function Spot(i, j) {
  this.i = i;
  this.j = j;
  this.f = 0;
  this.g = 0;
  this.h = 0;
  this.neighbors = [];
  this.previous = undefined;
  this.wall = false;
  // f(n) = g(n) + h(n)

  if (random(1) < wallPercentage) {
    this.wall = true;
  }

  this.show = function (col, scale = 1) {
    fill(col);
    noStroke();
    if (this.wall) {
      fill(0);
    }
    if (allowDiagonalWallSkip) {
      ellipse((this.i + borderSize) * w + w / 2, (this.j + borderSize) * h + h / 2, (w * scale) / radiusScale, (h * scale) / radiusScale)
    }
    else {
      rect((this.i + borderSize) * w, (this.j + borderSize) * h, w - 1, h - 1)
    }

  }

  this.addNeighbors = function (grid) {

    if (this.i < cols - 1) {
      this.neighbors.push(grid[this.i + 1][this.j])
    }
    if (this.i > 0) {
      this.neighbors.push(grid[this.i - 1][this.j])
    }
    if (this.j < rows - 1) {
      this.neighbors.push(grid[this.i][this.j + 1])
    }
    if (this.j > 0) {
      this.neighbors.push(grid[this.i][this.j - 1])
    }

    if (this.i > 0 && this.j > 0 && (allowDiagonalWallSkip || (!allowDiagonalWallSkip && (!grid[this.i][this.j - 1].wall && !grid[this.i - 1][this.j].wall)))) {
      this.neighbors.push(grid[this.i - 1][this.j - 1])
    }
    if (this.i < cols - 1 && this.j > 0 && (allowDiagonalWallSkip || (!allowDiagonalWallSkip && (!grid[this.i][this.j - 1].wall && !grid[this.i + 1][this.j].wall)))) {
      this.neighbors.push(grid[this.i + 1][this.j - 1])
    }
    if (this.i < cols - 1 && this.j < rows - 1 && (allowDiagonalWallSkip || (!allowDiagonalWallSkip && (!grid[this.i][this.j + 1].wall && !grid[this.i + 1][this.j].wall)))) {
      this.neighbors.push(grid[this.i + 1][this.j + 1])
    }
    if (this.i > 0 && this.j < rows - 1 && (allowDiagonalWallSkip || (!allowDiagonalWallSkip && (!grid[this.i][this.j + 1].wall && !grid[this.i - 1][this.j + 1].wall)))) {
      this.neighbors.push(grid[this.i - 1][this.j + 1])
    }

  }

}


function setup() {
  createCanvas(canvasWidth, canvasHeight);
  console.log("A*");

  createNewGame(cols, rows);
  getButtons();
  
}

function DisplayText()
{
  textSize(15);
  fill("black");
  noStroke();
  text("Number of columns:", 0,835);
  text("Number of rows:", 0,865);
  text("Walls percentage:", 0,895);
  
}

function getButtons()
{
  gridButton = createButton("Create new Map");
  gridButton.mousePressed(createNewGameUsingButton);
  gridButton.position(40,910);
  
  button = createButton("Start A*");
  button.mousePressed(() => gameStarted = !gameStarted);
  button.position(250,880);

  checkboxDetails = createCheckbox('Show more details', false);
  checkboxDetails.changed(myCheckedDetailsEvent);
  checkboxDetails.position(250,820)
  
  
  checkbox = createCheckbox('Allow Diagonal wall skip', false);
  checkbox.changed(myCheckedEvent);
  checkbox.position(250,850)
  
  var colsInput = createInput(cols.toString());
  colsInput.size(75);
  colsInput.input(GetColsInput);
  colsInput.position(150,820)
  
  var rowsInput = createInput(rows.toString());
  rowsInput.size(75);
  rowsInput.input(GetRowsInput);
  rowsInput.position(150,850)
  

  
  slider = createSlider(0, 1, 0.3, 0.01);
  slider.position(150, 880);
  slider.style('width', '80px');
}



function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

function createNewGameUsingButton()
{
  wallPercentage = slider.value();
  createNewGame();
}

function createNewGame() {
  
  
  cols = inputCols;
  rows = inputRows;
  allowDiagonalWallSkip = inputAllowDiagonalWallSkip;
  grid = new Array();

  w = canvasWidth / (cols + borderSize * 2);
  h = canvasWidth / (rows + borderSize * 2);

  createSpots(cols, rows);
  findNeighbors(cols, rows);

  start = grid[getRandomInt(cols - 1)][getRandomInt(rows - 1)];
  end = start;

  while (start.i == end.i && start.j == end.j) {
    end = grid[getRandomInt(cols - 1)][getRandomInt(rows - 1)];
  }

  closedList = [];
  openList = [];
  gameStarted = false;
  gameFinished = false;
  openList.push(start);
  start.wall = false;
  end.wall = false;
  loop();
}

function createSpots(cols, rows) {
  for (var i = 0; i < cols; i++) {
    grid[i] = new Array(rows);
  }

  for (var i = 0; i < cols; i++) {
    for (var j = 0; j < rows; j++) {
      grid[i][j] = new Spot(i, j);
    }
  }
}

function findNeighbors(cols, rows) {
  for (var i = 0; i < cols; i++) {
    for (var j = 0; j < rows; j++) {
      grid[i][j].addNeighbors(grid);
    }
  }
}

function calculateScores(current, openList, closedList) {
  var neighbors = current.neighbors;

  for (var i = 0; i < neighbors.length; i++) {
    var neighbor = neighbors[i];
    if (!closedList.includes(neighbor) && !neighbor.wall) {
      var tempG = current.g + 1;
      var betterPathFound = false;

      if (openList.includes(neighbor)) {
        if (tempG < neighbor.g) {
          neighbor.g = tempG;
          betterPathFound = true;
        }
      }
      else {
        neighbor.g = tempG;
        openList.push(neighbor);
        betterPathFound = true;
      }
      if (betterPathFound) {
        neighbor.h = heuristic(neighbor, end);
        neighbor.f = neighbor.h + neighbor.g;
        neighbor.previous = current;
      }

    }
  }
}

function draw() {
  background(255);
  DisplayText();
  
  createEmptyGrid(cols, rows);


  if (!gameStarted) return;
  
  var current = undefined;

  if (!gameFinished && gameStarted) {
    if (openList.length > 0) {
      var lowestIndex = 0;

      for (var i = 0; i < openList.length; i++) {
        if (openList[i].f < openList[lowestIndex].f) {
          lowestIndex = i;
        }
      }

      current = openList[lowestIndex];

      if (current === end) {

        console.log("CODE DONE");
        gameFinished = true;
      }

      removeFromArray(openList, current);
      closedList.push(current);
      calculateScores(current, openList, closedList);
      

    }
    else {
      //no solution
      console.log("No solution");
      gameFinished = true;
      noLoop();
      
    }
    colorGrid(current, openList, closedList);
    
  }

  if (gameStarted && gameFinished) {
    noLoop();
  }





}

function getPath(current) {
  path = [];
  var temp = current;
  path.push(temp)
  while (temp.previous) {
    path.push(temp.previous);
    temp = temp.previous;
  }
  return path;
}

function showBorder(cols, rows) {
  fill(220, 220, 220);
  noStroke();

  if (allowDiagonalWallSkip) {
    for (var j = 0; j < borderSize; j++) {
      for (var i = 0; i < (cols + (borderSize - 1 - j) * 2); i++) //(borderSize - 1 - j)*2 because borderSize extends number of columns
      {
        ellipse((j + i + 1) * w + w / 2, (j) * h + h / 2, w / radiusScale, h / radiusScale)
        ellipse((j + i + 1) * w + w / 2, (borderSize * 2 + rows - j - 1) * h + h / 2, w / radiusScale, h / radiusScale)
      }
      for (var i = 0; i < (rows + (borderSize - 1 - j) * 2); i++) {
        ellipse((j) * w + w / 2, (j + i + 1) * h + h / 2, w / radiusScale, h / radiusScale)
        ellipse((borderSize * 2 + cols - j - 1) * w + w / 2, (j + i + 1) * h + h / 2, w / radiusScale, h / radiusScale)
      }

    }
    for (var j = 0; j < borderSize; j++) {
      ellipse((j) * w + w / 2, (j) * h + h / 2, w / radiusScale, h / radiusScale)
      ellipse((cols + (borderSize - 1 - j) * 2 + j + 1) * w + w / 2, (j) * h + h / 2, w / radiusScale, h / radiusScale)

      ellipse((j) * w + w / 2, (rows + (borderSize - 1 - j) * 2 + j + 1) * h + h / 2, w / radiusScale, h / radiusScale)
      ellipse((cols + (borderSize - 1 - j) * 2 + j + 1) * w + w / 2, (rows + (borderSize - 1 - j) * 2 + j + 1) * h + h / 2, w / radiusScale, h / radiusScale)

    }

  }
  else {
    for (var j = 0; j < borderSize; j++) {
      for (var i = 0; i < (cols + (borderSize - 1 - j) * 2); i++) //(borderSize - 1 - j)*2 because borderSize extends number of columns
      {
        rect((j + i + 1) * w, (j) * h, w - 1, h - 1)
        rect((j + i + 1) * w, (borderSize * 2 + rows - j - 1) * h, w - 1, h - 1)
      }
      for (var i = 0; i < (rows + (borderSize - 1 - j) * 2); i++) {
        rect((j) * w, (j + i + 1) * h, w - 1, h - 1)
        rect((borderSize * 2 + cols - j - 1) * w, (j + i + 1) * h, w - 1, h - 1)
      }

    }
      for (var j = 0; j < borderSize; j++) {
    rect((j) * w, (j) * h, w - 1, h - 1)
    rect((cols + (borderSize - 1 - j) * 2 + j + 1) * w, (j) * h, w - 1, h - 1)
    rect((j) * w, (rows + (borderSize - 1 - j) * 2 + j + 1) * h, w - 1, h - 1)
    rect((cols + (borderSize - 1 - j) * 2 + j + 1) * w, (rows + (borderSize - 1 - j) * 2 + j + 1) * h, w - 1, h - 1)
  }


  }

}

function createEmptyGrid(cols, rows) {
  for (var i = 0; i < cols; i++) {
    for (var j = 0; j < rows; j++) {
      grid[i][j].show(color(255));
    }
  }
  showBorder(cols, rows);
  start.show(color(0, 255, 0), 1.4);
  end.show(color(255, 0, 0), 1.4);
}

function colorGrid(current, openList, closedList) {

 
  if (showDetails)
     
  
    {
      fill(255,0,0,100);
      for (var i = 0; i < openList.length; i++) {
        
    if (openList[i] == start || openList[i] == end)
      {
        continue;
      }
      if (allowDiagonalWallSkip)
        {
           ellipse((openList[i].i + borderSize) * w + w / 2, (openList[i].j + borderSize) * h + h / 2, w / radiusScale, h / radiusScale)
        }
      else
        {
          rect((openList[i].i + borderSize) * w, (openList[i].j + borderSize) * h, w - 1, h - 1)
        }
   
  }
  for (var i = 0; i < closedList.length; i++) {
      if (closedList[i] == start || closedList[i] == end)
      {
        continue;
      }
    fill(0,255,0,100);
    if (allowDiagonalWallSkip)
      {
            ellipse((closedList[i].i + borderSize) * w + w / 2, (closedList[i].j + borderSize) * h + h / 2, w / radiusScale, h / radiusScale)
      }
    else
  {
    rect((closedList[i].i + borderSize) * w, (closedList[i].j + borderSize) * h, w - 1, h - 1)
  }
  }
    }

  
  var path = getPath(current);
  noFill();
  stroke(0, 0, 255);
  strokeWeight(w / 2);
  beginShape();
  for (var i = 0; i < path.length; i++) {
    vertex((path[i].i + borderSize) * w + w / 2, (path[i].j + borderSize) * h + h / 2)

  }
  endShape();

}

 function myCheckedEvent() {
  if (checkbox.checked()) {
    inputAllowDiagonalWallSkip = true;
  } else {
    inputAllowDiagonalWallSkip = false;
  }
}

 function myCheckedDetailsEvent() {
  if (checkboxDetails.checked()) {
    showDetails = true;
  } else {
    showDetails = false;
  }
}

 function GetColsInput() {
  const userInput = this.value();
  const onlyDigits = userInput.replace(/^0+|[^\d]/g, '');
  
  if (userInput !== onlyDigits) {
    this.value(onlyDigits);
  }
  else
    {

          inputCols = parseInt(userInput);
         
    }
}

function GetRowsInput() {
  const userInput = this.value();
  const onlyDigits = userInput.replace(/^0+|[^\d]/g, '');
  
  if (userInput !== onlyDigits) {
    this.value(onlyDigits);
  }
  else
    {
          inputRows = parseInt(userInput);
    }
 
  
}
