import fs from "fs";
import config from "@mercadoni/elementals/config";

const inputFile = config.get("input")
const outputFile = config.get("output")

const delay = (ms: number) => {
  return new Promise(resolve => setTimeout(resolve, ms));
}

type Point = { x: number; y: number };

function calculateYCollision(point1: Point, point2: Point, leftWall: boolean): number {
  const gridHeight = 600;
  point1.x = point1.x - 50;
  point2.x = point2.x - 50;

  if(leftWall){
    point1.x = point1.x - 7;
    point2.x = point2.x - 7;
  }else{
    point1.x = point1.x + 7;
    point2.x = point2.x + 7;
  }

  const vx = point2.x - point1.x;
  const vy = point2.y - point1.y;

  const wallX = leftWall ? 0 : 800;
  const timeToCollision = (wallX - point2.x) / vx;
  // console.log('time to collision', timeToCollision);

  let yCollision = point2.y + vy * timeToCollision;

  while (yCollision < 0 || yCollision > gridHeight) {
      if (yCollision < 0) {
          yCollision = -yCollision; 
      } else if (yCollision > gridHeight) {
          yCollision = 2 * gridHeight - yCollision; 
      }
  }

  return yCollision;
}

interface DataPoint {
  px: number,
  py: number,
  e: number,
  bx: number,
  by: number
}
const isTheBallPointingMe = (points: DataPoint[]) => {
  if(points.length < 2){
    return false;
  }
  const n = points.length;
  const actual = points[n - 1];
  const before = points[n - 2];
  const myPosition = actual.px;
  if((myPosition <= actual.bx && actual.bx <= before.bx) || (myPosition >= actual.bx && actual.bx >= before.bx)){
    return true;
  }else{
    return false;
  }
  
}

(async () => {
  
  console.log({ inputFile, outputFile })
  let points: any[] = [];
  while (true) {
    try{
      console.log('iteration!')
      const delta = 5;
      const input = fs.readFileSync(inputFile, { encoding: "utf-8" })
      const [px, py, e, bx, by] = input.split(",").map(s => { return s.trim() });
      const point : DataPoint = { px: Number(px), py: Number(py), e: Number(e), bx: Number(bx), by: Number(by) };
      points.push(point);
      points = points.slice(-50);
      //console.log(points);
  
      const n = points.length;
      
      if (Number(e) < 5) {
        console.log(Number(e) < 20)
        fs.writeFileSync(outputFile, "0", { "encoding": "utf-8" })
      } else {
        let direction = 0;
        if(isTheBallPointingMe(points)){
          // console.log('yes')
                // Example usage
          const p1 = { x: 450, y: 300 }; // Starting point
          const p2 = { x: 600, y: 500 }; // Direction point
          const targetX = 0; // Target x-coordinate
          if(points.length > 10){
            const wall = points[n - 1].px < 400
            const result = calculateYCollision({
              x: points[n - 2].bx,
              y: points[n - 2].by,
            }, 
            {
              x: points[n - 1].bx,
              y: points[n - 1].by,
            }, 
            wall);
            // console.log(`The ball will hit x=${targetX} at:`, result);
            if(!Number.isNaN(result)){
              // console.log({
              //   result, 
              //   poisition: points[n - 1].py
              // })
              if(result - points[n - 1].py < -40){
                direction = -1;
              }else if(result - points[n - 1].py > 40){
                direction = 1;
              }else{
                direction = 0;
              }
            }
          }
        }
        console.log({direction})
        fs.writeFileSync(outputFile, `${direction}`, { "encoding": "utf-8" })
      }
      await delay(50)

    }catch(err){
      console.log('XD')
    }
  
  }
  
  

})();
