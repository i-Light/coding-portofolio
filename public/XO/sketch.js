let xo, images;
// const socket = io('http://localhost:3000');
const socket = io('https://test-fyni.onrender.com');

const p5Container = document.querySelector("#p5-container");
// const centerP5Container = document.querySelector("#center-p5-container");
// let [w,h] = [centerP5Container.clientWidth, centerP5Container.clientHeight]
// let size = min(w,h)

function initialize_XO(){
  xo = new XO(Width = 300/1.2, grid_spacing = 3, images);
  socket.on("update", (data) => {
    xo.update(data);
  });
}
function preload() {
  let path = "/assets/images/"
  let image = ['X', "O"]
  images = {}
  image.forEach( name => Object.assign(images, {[name]:loadImage(`${path}${name}.png`)}) )
}

function setup() {
  let cnv = createCanvas(300/1.2, 300/1.2);
  cnv.parent(p5Container);
  initialize_XO();
  stroke(50);
  textAlign('center',"center");
  frameRate(9);
}

function draw() {
  background(0);
  xo.show();
}

class XO {
  constructor(Width, grid_spacing, images) {
    this.images = images;
    this.Width = Width;
    this.grid_spacing = Width/grid_spacing;
    this.turn = 'X';
    this.move_count = 0;
    this.GameOver = false;
    // Translates square notation to position on the screen
    this.sqr = {};
    // Holds the pieces
    this.block = {};
    // Setup Board
    this.Default_Setup();
  }
  Default_Setup() {
    this.turn = 'X';
    this.move_count = 0;
    this.GameOver = false;
    // Translates square notation to position on the screen
    this.sqr = {};
    // Holds the pieces
    this.block = {};
    // Selected square status
    let count = 0
    for (let y = this.Width - this.grid_spacing;y >= 0;y -= this.grid_spacing) {
      for (let x = 0;x < this.Width;x += this.grid_spacing) {
        this.sqr[count] = [x, y];
        this.block[count] = 0
        count+=1
      }
    }
    
  }
  update(data){ 
    [
      this.GameOver,
      this.turn,
      this.block
    ]
    = 
    [
      data.GameOver,
      data.turn,
      data.block
    ]
  }
  move(square1, square2) {
    if (this.Selection.moves[square2] || this.enemies[square2]){
      this.block[square2] = this.block[square1]
      this.block[square1] = 0
      this.alternateTurn();
      this.history = this.history.slice(0,this.historyIndex+1)
      this.history.push(this.savePosition())
      this.historyIndex++
    }
    this.deselect()
  }
  check_win(serial) {
    let D,R,C, previous, straight_path, diagonal_path, paths, count;
    D = serial%4
    R = serial % 3
    C = serial - R
    straight_path = [[R,3], [C, 1]]
    diagonal_path = [[D, 4], [D,2]]
    if (serial === 4){
      paths=[...straight_path, ...diagonal_path]
    }
    else if (D===0){
      paths = [...straight_path, diagonal_path[0]]
    }
    else if (D===2){
      paths = [...straight_path, diagonal_path[1]]
    }
    else{
      paths = straight_path
    }
    for (let [start, step] of paths){ 
      previous = this.block[start]
      count =0
      for (let i = start; i<=(step*2)+start; i+=step){
        if (this.isEmpty(i) || this.block[i]!=previous) break
        else{
          count+=1
          previous=this.block[i]
        }
        if (count===3){this.GameOver=this.turn;return 1}
      }
    }
    if (this.move_count >= 9) {this.GameOver = 'TIE'}
    return 0
  }
  valid_move(serial) {
    let empty;
    if (serial === -1 || this.GameOver) return false
    empty = this.isEmpty(serial);
    if (empty) return true;
    return false;
  }
  showPieces(img, pos) {
    if (img) {
      image(
        this.images[img],
        ...pos,
        this.grid_spacing,
        this.grid_spacing
      );
    }
  }
  show() {
    let clr = [0];
    let pos;
    let center = this.grid_spacing/2
    const Keys = Object.keys(this.sqr);
    for (const serial of Keys) {
      pos = this.sqr[serial];
      fill(...clr);
      square(...pos, this.grid_spacing);
      this.showPieces(this.block[serial], pos);
      if (this.block[serial]==0){
        textSize(32);
        fill("cyan");
      text(serial, pos[0]+center,pos[1]+center);
      }
    }
    if(this.GameOver){
      let txt = (this.GameOver === "TIE")?this.GameOver:`${this.GameOver} WINS`
      textSize(42);
      fill("yellow");
      text(txt, this.Width/2,this.Width/2);
    }
    
  }
  play(posX, posY){
    let serial = this.calculate_square(posX, posY)
    if (this.valid_move(serial)){
      this.block[serial] = this.turn
      this.check_win(serial);
      this.alternateTurn();
      let data = {"GameOver":this.GameOver,"turn":this.turn,"block":this.block}
      socket.emit('Played', data);
    }
  }
  calculate_square(posX, posY) {
    let pos;
    const Keys = Object.keys(this.sqr);
    for (const serial of Keys) {
      pos = this.sqr[serial];
      if (
        posX <= pos[0] + this.grid_spacing &&
        posX >= pos[0] &&
        posY <= pos[1] + this.grid_spacing &&
        posY >= pos[1]
      ) {
        return serial;
      }
    }
    return -1;
  }
  isEmpty(serial) {
    return this.block[serial] === 0;
  }
  isEnemy(serial, other){
    return this.block[serial] === this.block[other]
  }
  alternateTurn(){
    this.turn = (this.turn==="X")?"O":"X"
  }
}

function mousePressed() {
  xo.play(mouseX, mouseY);
}
// function mouseDragged(){
//   xo.Default_Setup()
// }
