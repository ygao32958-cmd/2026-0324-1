let bubbles = [];
let particles = [];
let fishes = []; // 小魚陣列
let seaweeds = []; // 水草配置
let popSound; // 泡泡破掉的音效
const SEAWEED_HEIGHT_RATIO = 0.3; // 水草基準高度比例（會做隨機變化）

function setup() {
  createCanvas(windowWidth, windowHeight);
  
  // 載入泡泡破掉音效
  popSound = loadSound('pop.mp3', function() {
    console.log('pop.mp3 已載入');
  }, function(err) {
    console.log('pop.mp3 載入失敗:', err);
  });
  
  // 初始化粒子系統
  for (let i = 0; i < 50; i++) {
    particles.push(new Particle());
  }
  
  // 初始化小魚
  for (let i = 0; i < 5; i++) {
    fishes.push(new Fish());
  }

  // 初始化水草（不同顏色、粗細、高度、位置）
  const targetSeaweedCount = 12;
  for (let i = 0; i < targetSeaweedCount; i++) {
    seaweeds.push({
      baseX: map(i, 0, targetSeaweedCount - 1, 50, windowWidth - 50) + random(-20, 20),
      width: random(20, 55),
      heightRatio: random(0.25, 0.6),
      colorIndex: i % 10,
      phase: random(1000)
    });
  }
}

function draw() {
  // 透明 Canvas 保留底層網站背景
  clear();

  // 繪製粒子
  drawParticles();

  // 繪製小魚
  drawFishes();

  // 繪製水草
  drawSeaweed();

  // 繪製泡泡
  drawBubbles();

  // 隨機生成新泡泡
  if (random() < 0.1) {
    bubbles.push(new Bubble());
  }
}

function drawSeaweed() {
  for (let i = 0; i < seaweeds.length; i++) {
    const s = seaweeds[i];
    // 一點點左/右動以呈現疊加
    s.baseX += sin(frameCount * 0.01 + i) * 0.15;
    drawSingleSeaweed(s.baseX, s.width, s.colorIndex, s.heightRatio, s.phase);
  }
}

function drawSingleSeaweed(baseX, width, index, heightRatio, phase) {
  const seaweedHeight = windowHeight * heightRatio;
  const segments = 100; // 水草分段數增加
  const segmentLength = seaweedHeight / segments;

  const mouseDist = dist(mouseX, mouseY, baseX, windowHeight);
  const interactOffset = map(constrain(mouseDist, 0, 160), 0, 160, 1.5, 0);

  // 為每條水草設置不同顏色
  const colors = [
    {fill: [150, 220, 100], stroke: [100, 180, 60]},      // 黃綠
    {fill: [100, 200, 150], stroke: [60, 160, 100]},       // 青綠
    {fill: [130, 210, 140], stroke: [80, 170, 90]},        // 淺綠
    {fill: [170, 210, 90], stroke: [120, 170, 40]},        // 草綠
    {fill: [100, 220, 120], stroke: [50, 180, 70]},        // 亮綠
    {fill: [140, 200, 110], stroke: [90, 160, 60]},        // 灰綠
    {fill: [160, 215, 105], stroke: [110, 175, 55]},       // 暖綠
    {fill: [120, 210, 130], stroke: [70, 170, 80]},        // 冷綠
    {fill: [155, 225, 95], stroke: [105, 185, 45]},        // 檸檬綠
    {fill: [110, 205, 140], stroke: [60, 165, 90]}         // 薄荷綠
  ];
  
  const colorIndex = index % colors.length;
  const currentColor = colors[colorIndex];
  
  // 設置填充與輪廓（確保水草著色）
  fill(currentColor.fill[0], currentColor.fill[1], currentColor.fill[2], 255); // 不透明
  stroke(currentColor.stroke[0], currentColor.stroke[1], currentColor.stroke[2], 255);
  strokeWeight(1.5);

  beginShape();
  
  // 左側邊界 - 使用多層noise產生連續波浪
  for (let i = 0; i <= segments; i++) {
    const y = windowHeight - i * segmentLength;
    // 使用多個noise層產生更複雜的波浪效果
    const noiseVal1 = noise((baseX + phase) * 0.005, i * 0.02 + frameCount * 0.008, index);
    const noiseVal2 = noise((baseX + phase) * 0.01 + 10, i * 0.05 + frameCount * 0.015, index);
    const offset = map(noiseVal1, 0, 1, -width/2, width/2) + map(noiseVal2, 0, 1, -width/4, width/4);
    const x = baseX + offset + interactOffset * 10; // 鼠標影響變形
    vertex(x, y);
  }
  
  // 水草頂部圓型且向下彎
  const topNoise = noise(baseX * 0.005, frameCount * 0.008, index);
  const topOffset = map(topNoise, 0, 1, -width/2, width/2);
  const topBaseX = baseX + topOffset + width / 2;
  const headRadius = width * 1.2;
  
  // 繪製圓頭部分（上半圓）
  for (let angle = 0; angle <= PI; angle += PI / 20) {
    const headX = topBaseX + cos(angle - PI/2) * headRadius;
    const headY = windowHeight - segments * segmentLength - sin(angle - PI/2) * headRadius - width * 0.3; // 向下彎
    vertex(headX, headY);
  }
  
  // 右側邊界（反向回行）- 使用相同的波浪效果創造厚度
  for (let i = segments; i >= 0; i--) {
    const y = windowHeight - i * segmentLength;
    // 使用相同的noise但加上偏移量來產生厚度
    const noiseVal1 = noise((baseX + phase) * 0.005, i * 0.02 + frameCount * 0.008, index);
    const noiseVal2 = noise((baseX + phase) * 0.01 + 10, i * 0.05 + frameCount * 0.015, index);
    const offset = map(noiseVal1, 0, 1, -width/2, width/2) + map(noiseVal2, 0, 1, -width/4, width/4);
    const x = baseX + offset + width + interactOffset * 10;
    vertex(x, y);
  }
  
  endShape(CLOSE);
  
  // 繪製波浪紋理線條（同一顏色調）
  stroke(currentColor.stroke[0] + 20, currentColor.stroke[1] + 20, currentColor.stroke[2] + 20, 150);
  strokeWeight(1);
  for (let i = 0; i < segments; i += 5) {
    const y = windowHeight - i * segmentLength;
    const noiseVal1 = noise(baseX * 0.005, i * 0.02 + frameCount * 0.008, index);
    const noiseVal2 = noise(baseX * 0.01 + 10, i * 0.05 + frameCount * 0.015, index);
    const offsetLeft = map(noiseVal1, 0, 1, -width/2, width/2) + map(noiseVal2, 0, 1, -width/4, width/4);
    const offsetRight = offsetLeft;
    const xLeft = baseX + offsetLeft;
    const xRight = baseX + offsetRight + width;
    line(xLeft, y, xRight, y); // 畫橫線作為波浪紋理
  }
  
  // 繪製眼睛（只有右眼）
  fill(0);
  noStroke();
  const eyeY = windowHeight - segments * segmentLength - width * 0.8;
  const eyeOffsetX = width * 0.5;
  // 右眼
  circle(baseX + topOffset + width / 2 + eyeOffsetX, eyeY, width * 0.3);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function drawInteractiveBackground() {
  // 創建動態漸變背景，根據鼠標位置變化
  for (let y = 0; y < height; y++) {
    // 根據鼠標X位置改變顏色
    let inter = map(mouseX, 0, width, 0, 1);
    let c1 = color(202, 240, 248); // 淺藍 #caf0f8
    let c2 = color(150, 220, 255); // 較深的藍
    let c3 = color(100, 200, 255); // 更深的藍
    
    let gradientColor;
    if (y < height * 0.3) {
      gradientColor = lerpColor(c1, c2, inter);
    } else if (y < height * 0.7) {
      gradientColor = lerpColor(c2, c3, inter);
    } else {
      gradientColor = c3;
    }
    
    // 添加時間變化
    let timeOffset = sin(frameCount * 0.01 + y * 0.01) * 10;
    gradientColor = color(
      red(gradientColor) + timeOffset,
      green(gradientColor) + timeOffset * 0.5,
      blue(gradientColor) + timeOffset * 0.8
    );
    
    stroke(gradientColor);
    line(0, y, width, y);
  }
}

function drawParticles() {
  // 更新和繪製所有粒子
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    particles[i].display();
  }
}

function drawFishes() {
  // 更新和繪製所有小魚
  for (let i = 0; i < fishes.length; i++) {
    fishes[i].update();
    fishes[i].display();
  }
}

function drawBubbles() {
  // 更新和繪製所有泡泡
  for (let i = bubbles.length - 1; i >= 0; i--) {
    bubbles[i].update();
    bubbles[i].display();
    
    // 移除已破裂的泡泡
    if (bubbles[i].isDead()) {
      // 泡泡破掉時播放音效（只播放一次）
      if (!bubbles[i].soundPlayed && popSound) {
        popSound.play();
        bubbles[i].soundPlayed = true;
      }
      bubbles.splice(i, 1);
    }
  }
}

// 泡泡類
class Bubble {
  constructor() {
    this.x = random(windowWidth * 0.3, windowWidth * 0.7);
    this.y = windowHeight;
    this.radius = random(15, 35);
    this.speed = random(1, 3);
    this.wobble = random(-0.02, 0.02); // 搖晃速度
    this.wobbleAmount = 0;
    this.lifespan = 255; // 透明度
    this.maxLife = 255;
    this.topY = windowHeight * (1 - SEAWEED_HEIGHT_RATIO); // 泡泡上升的終點
    this.soundPlayed = false; // 標記音效是否已播放
  }
  
  update() {
    // 上升
    this.y -= this.speed;
    
    // 左右搖晃
    this.wobbleAmount += this.wobble;
    this.x += sin(this.wobbleAmount) * 0.5;
    
    // 隨著上升逐漸透明化
    this.lifespan = map(this.y, windowHeight, this.topY, this.maxLife, 0);
  }
  
  display() {
    // 繪製泡泡
    fill(255, 255, 255, this.lifespan * 0.6); // 半透明白色
    stroke(200, 220, 240, this.lifespan);
    strokeWeight(2);
    circle(this.x, this.y, this.radius * 2);
    
    // 泡泡內的光暈效果
    fill(255, 255, 255, this.lifespan * 0.3);
    noStroke();
    circle(this.x - this.radius * 0.3, this.y - this.radius * 0.3, this.radius * 0.5);
  }
  
  isDead() {
    // 當泡泡到達頂部或完全透明時死亡
    return this.y < this.topY || this.lifespan <= 0;
  }
}

// 粒子類 - 互動背景粒子
class Particle {
  constructor() {
    this.x = random(width);
    this.y = random(height);
    this.size = random(2, 8);
    this.speedX = random(-0.5, 0.5);
    this.speedY = random(-0.5, 0.5);
    this.alpha = random(50, 150);
    this.color = color(random(100, 200), random(150, 250), random(200, 255), this.alpha);
  }
  
  update() {
    // 粒子跟隨鼠標運動
    let mouseDist = dist(this.x, this.y, mouseX, mouseY);
    if (mouseDist < 100) {
      // 鼠標附近粒子被吸引
      let angle = atan2(mouseY - this.y, mouseX - this.x);
      this.speedX += cos(angle) * 0.1;
      this.speedY += sin(angle) * 0.1;
    } else {
      // 遠離鼠標的粒子緩慢運動
      this.speedX *= 0.98;
      this.speedY *= 0.98;
    }
    
    // 限制速度
    this.speedX = constrain(this.speedX, -2, 2);
    this.speedY = constrain(this.speedY, -2, 2);
    
    // 更新位置
    this.x += this.speedX;
    this.y += this.speedY;
    
    // 邊界檢查
    if (this.x < 0 || this.x > width) {
      this.speedX *= -1;
      this.x = constrain(this.x, 0, width);
    }
    if (this.y < 0 || this.y > height) {
      this.speedY *= -1;
      this.y = constrain(this.y, 0, height);
    }
    
    // 根據鼠標距離調整透明度
    let mouseDistAlpha = map(mouseDist, 0, 200, 200, 50);
    this.alpha = mouseDistAlpha;
    this.color = color(red(this.color), green(this.color), blue(this.color), this.alpha);
  }
  
  display() {
    noStroke();
    fill(this.color);
    
    // 根據鼠標距離改變粒子形狀
    let mouseDist = dist(this.x, this.y, mouseX, mouseY);
    if (mouseDist < 50) {
      // 鼠標附近顯示為星星形狀
      push();
      translate(this.x, this.y);
      rotate(frameCount * 0.05);
      beginShape();
      for (let i = 0; i < 5; i++) {
        let angle = TWO_PI * i / 5 - PI/2;
        let x = cos(angle) * this.size;
        let y = sin(angle) * this.size;
        vertex(x, y);
        angle += TWO_PI / 10;
        x = cos(angle) * this.size * 0.5;
        y = sin(angle) * this.size * 0.5;
        vertex(x, y);
      }
      endShape(CLOSE);
      pop();
    } else {
      // 遠處顯示為圓形
      circle(this.x, this.y, this.size);
    }
  }
}

// 小魚類
class Fish {
  constructor() {
    this.x = random(width);
    this.y = random(windowHeight * 0.2, windowHeight * 0.7); // 在中間高度游動
    this.size = random(15, 25);
    this.speed = random(1, 3);
    this.direction = random([1, -1]); // 1 向右，-1 向左
    this.color = color(random(100, 255), random(100, 255), random(100, 255));
  }
  
  update() {
    // 左右游動
    this.x += this.speed * this.direction;
    
    // 邊界檢查，碰到邊界時轉向
    if (this.x < 0 || this.x > width) {
      this.direction *= -1;
      this.x = constrain(this.x, 0, width);
    }
    
    // 隨機上下浮動
    this.y += sin(frameCount * 0.02 + this.x * 0.01) * 0.5;
    this.y = constrain(this.y, windowHeight * 0.15, windowHeight * 0.75);
  }
  
  display() {
    push();
    translate(this.x, this.y);
    
    // 根據方向翻轉魚
    if (this.direction === -1) {
      scale(-1, 1);
    }
    
    // 繪製魚身
    fill(this.color);
    stroke(0);
    strokeWeight(1);
    
    // 魚身（橢圓）
    ellipse(0, 0, this.size, this.size * 0.6);
    
    // 魚頭（圓）
    circle(this.size * 0.3, 0, this.size * 0.5);
    
    // 魚眼
    fill(255);
    noStroke();
    circle(this.size * 0.5, -this.size * 0.1, this.size * 0.15);
    fill(0);
    circle(this.size * 0.5, -this.size * 0.1, this.size * 0.08);
    
    // 魚尾（三角形）
    fill(this.color);
    stroke(0);
    strokeWeight(1);
    beginShape();
    vertex(-this.size * 0.3, 0);
    vertex(-this.size * 0.6, -this.size * 0.2);
    vertex(-this.size * 0.6, this.size * 0.2);
    endShape(CLOSE);
    
    // 魚鰭（小三角形）
    beginShape();
    vertex(0, -this.size * 0.3);
    vertex(this.size * 0.15, -this.size * 0.5);
    vertex(this.size * 0.25, -this.size * 0.3);
    endShape(CLOSE);
    
    pop();
  }
}

function mousePressed() {
  // 點擊時在鼠標位置創建新粒子
  for (let i = 0; i < 5; i++) {
    let p = new Particle();
    p.x = mouseX + random(-20, 20);
    p.y = mouseY + random(-20, 20);
    p.speedX = random(-3, 3);
    p.speedY = random(-3, 3);
    p.size = random(3, 10);
    particles.push(p);
  }
}
