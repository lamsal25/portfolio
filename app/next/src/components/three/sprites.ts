import type * as THREE from "three";
export function textSprite(T: typeof THREE, text: string, dark: boolean, fontSize = 38) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 96;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = dark ? "#f4f3ef" : "#172337";
  ctx.font = "600 " + fontSize + "px Arial";
  ctx.textAlign = "center";
  ctx.fillText(text, 256, 60);
  const texture = new T.CanvasTexture(canvas);
  const sprite = new T.Sprite(
    new T.SpriteMaterial({ map: texture, depthTest: false, transparent: true }),
  );
  sprite.scale.set(1.25, 0.235, 1);
  return sprite;
}
