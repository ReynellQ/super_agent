import fs from "fs";
import config from "@mercadoni/elementals/config";

const inputFile = config.get("input");
const outputFile = config.get("output");

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

type Point = { x: number; y: number };

interface DataPoint {
  px: number;
  py: number;
  e: number;
  bx: number;
  by: number;
}

/**
 * Calcular la colisión Y de la pelota con la pared o con un jugador.
 * @param point1 Punto de la posición anterior.
 * @param point2 Punto de la posición actual.
 * @param leftWall Indica si la pared es la izquierda (true) o derecha (false).
 * @returns La posición Y de la colisión ajustada.
 */
function calculateYCollision(point1: Point, point2: Point, leftWall: boolean): number {
  const gridHeight = 600;
  point1.x -= 50;
  point2.x -= 50;

  // Ajuste para la pared izquierda o derecha
  if (leftWall) {
    point1.x -= 7;
    point2.x -= 7;
  } else {
    point1.x += 7;
    point2.x += 7;
  }

  const vx = point2.x - point1.x;
  const vy = point2.y - point1.y;

  const wallX = leftWall ? 0 : 800;
  const timeToCollision = (wallX - point2.x) / vx;

  let yCollision = point2.y + vy * timeToCollision;

  // Ajustar si la colisión se sale del límite
  for(let i = 1 ; i < 10 ; i++){
    if(yCollision < 0 || yCollision > gridHeight){
      if (yCollision < 0) {
        yCollision = -yCollision;
      } else if (yCollision > gridHeight) {
          yCollision = 2 * gridHeight - yCollision;
      }
    }
  }

  return yCollision;
}

/**
 * Determina si la pelota se está dirigiendo hacia el jugador.
 * @param points Array de puntos con información de la pelota y el jugador.
 * @returns Verdadero si la pelota se dirige hacia el jugador.
 */
const isBallPointingToPlayer = (points: DataPoint[]): boolean => {
  if (points.length < 2) return false;

  const lastPoint = points[points.length - 1];
  const previousPoint = points[points.length - 2];

  const myPosition = lastPoint.px;
  const ballDirection = (myPosition <= lastPoint.bx && lastPoint.bx <= previousPoint.bx) ||
                        (myPosition >= lastPoint.bx && lastPoint.bx >= previousPoint.bx);

  return ballDirection;
};

/**
 * Calcula la dirección hacia la que el jugador debe moverse para interceptar la pelota.
 * @param currentY Posición Y actual del jugador.
 * @param ballY Posición Y de la pelota.
 * @param energy Nivel de energía del jugador.
 * @returns 1 para moverse hacia abajo, -1 para moverse hacia arriba, 0 para quedarse quieto.
 */
function calculateDirection(currentY: number, ballY: number, energy: number): number {
  if (energy < 10) return 0; // Si la energía es baja, no mover.

  if (ballY < currentY - 40) {
    return -1; // Mover hacia arriba
  } else if (ballY > currentY + 40) {
    return 1; // Mover hacia abajo
  }

  return 0; // No mover
}

/**
 * Centra al jugador en la posición Y=300 si está demasiado lejos del centro.
 * @param currentY Posición Y actual del jugador.
 * @param energy Nivel de energía del jugador.
 * @returns 1 para moverse hacia abajo, -1 para moverse hacia arriba, 0 para quedarse quieto.
 */
function centerPlayerIfNeeded(currentY: number, energy: number): number {
  const centerY = 300; // Y central del campo, suponiendo que el campo tiene una altura de 600 (ajustar si es necesario)
  const extremeThreshold = 50; // Umbral para considerar que el jugador está lejos del centro

  // Si la posición Y del jugador está demasiado lejos del centro, mover hacia el centro
  if (currentY < centerY - extremeThreshold) {
    return 1; // Mover hacia abajo
  } else if (currentY > centerY + extremeThreshold) {
    return -1; // Mover hacia arriba
  }

  return 0; // Ya está en el centro
}

(async () => {
  try {
    console.log({ inputFile, outputFile });

    const points: DataPoint[] = [];
    while (true) {
      const input = fs.readFileSync(inputFile, { encoding: "utf-8" });
      const [px, py, e, bx, by] = input.split(",").map(s => s.trim());

      const point: DataPoint = { px: Number(px), py: Number(py), e: Number(e), bx: Number(bx), by: Number(by) };
      points.push(point);

      if (e < 10) {
        fs.writeFileSync(outputFile, "0", { encoding: "utf-8" });
      } else {
        let direction = 0;

        // Si la pelota se está dirigiendo hacia el jugador
        if (isBallPointingToPlayer(points)) {
          const wall = points[points.length - 1].px < 400;
          const result = calculateYCollision({
            x: points[points.length - 2].bx,
            y: points[points.length - 2].by,
          }, {
            x: points[points.length - 1].bx,
            y: points[points.length - 1].by,
          }, wall);

          if (!Number.isNaN(result)) {
            direction = calculateDirection(points[points.length - 1].py, result, points[points.length - 1].e);
          }
        } else {
          // Si la pelota no va hacia el jugador, centrar al jugador en el campo
          direction = centerPlayerIfNeeded(points[points.length - 1].py, points[points.length - 1].e);
        }

        fs.writeFileSync(outputFile, `${direction}`, { encoding: "utf-8" });
      }

      await delay(100);
    }
  } catch (err) {
    console.log("Error:", err);
  }
})();