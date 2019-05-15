/**
 * @license
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */
import * as posenet from '@tensorflow-models/posenet';
import * as tf from '@tensorflow/tfjs';

const color = 'aquamarine';
const boundingBoxColor = 'red';
const lineWidth = 2;
//added by me
var right_wrist_pos = [0];
var right_wrist_continuous = false;
var right_wrist_continuous_count = 0;
var left_wrist_pos = [0];
var left_wrist_continuous = false;
var left_wrist_continuous_count = 0;
var questions = new Array();
var cur_question = new String();
var question_cnt = 0;
var min;
var sec;
var intervalVal;
export var correct = false;
export var correct_time = new Date().getTime();

function toTuple({y, x}) {
  return [y, x];
}

export function drawPoint(ctx, y, x, r, color) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
}

/**
 * Draws a line on a canvas, i.e. a joint
 */
export function drawSegment([ay, ax], [by, bx], color, scale, ctx) {
  ctx.beginPath();
  ctx.moveTo(ax * scale, ay * scale);
  ctx.lineTo(bx * scale, by * scale);
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = color;
  ctx.stroke();
}

/**
 * Draws a pose skeleton by looking up all adjacent keypoints/joints
 */
export function drawSkeleton(keypoints, minConfidence, ctx, scale = 1) {
  const adjacentKeyPoints =
      posenet.getAdjacentKeyPoints(keypoints, minConfidence);

  adjacentKeyPoints.forEach((keypoints) => {
    drawSegment(
        toTuple(keypoints[0].position), toTuple(keypoints[1].position), color,
        scale, ctx);
  });
}

/**
 * Draw pose keypoints onto a canvas
 */
export function drawKeypoints(keypoints, minConfidence, ctx, scale = 1) {
  for (let i = 0; i < keypoints.length; i++) {
    const keypoint = keypoints[i];

    if (keypoint.score < minConfidence) {
      continue;
    }

    const {y, x} = keypoint.position;
    drawPoint(ctx, y * scale, x * scale, 3, color);
  }
}

export function drawKeypoint(id, keypoints, minConfidence, ctx, scale = 1) {
  //drawCircle(ctx, 250 * scale, 300 * scale, 120, 'red', 20);
  var keypoint = keypoints[id];
  if(id == 9) 
  {
    if(!left_wrist_continuous)
      while(left_wrist_pos.length > 0)
        left_wrist_pos.pop();
    else if(left_wrist_pos.length > 20)
      left_wrist_pos.shift();

    if (keypoint.score >= minConfidence) {
      left_wrist_pos.push(keypoint);
      left_wrist_continuous = true;
      left_wrist_continuous_count = 0;
    }
    else
    {
      ++left_wrist_continuous_count;
      if(left_wrist_continuous_count > 5)
      {
        left_wrist_continuous_count = 0;
        left_wrist_continuous = false;
      }
    }

    for (let i = 0; i < left_wrist_pos.length; i++) {
      keypoint = left_wrist_pos[i];
      const {y, x} = keypoint.position;
      drawPoint(ctx, y * scale, x * scale, 5, 'cornflowerblue');
    }
  }
  else if(id == 10)
  {
    if(!right_wrist_continuous)
      while(right_wrist_pos.length > 0)
        right_wrist_pos.pop();
    else if(right_wrist_pos.length > 20)
      right_wrist_pos.shift();

    if (keypoint.score >= minConfidence) {
      right_wrist_pos.push(keypoint);
      right_wrist_continuous = true;
      right_wrist_continuous_count = 0;
    }
    else
    {
      ++right_wrist_continuous_count;
      if(right_wrist_continuous_count > 5)
      {
        right_wrist_continuous_count = 0;
        right_wrist_continuous = false;
      }
    }

    for (let i = 0; i < right_wrist_pos.length; i++) {
      keypoint = right_wrist_pos[i];
      const {y, x} = keypoint.position;
      drawPoint(ctx, y * scale, x * scale, 5, 'lightpink');
    }
  }
  else
  {
    const {y, x} = keypoint.position;
    drawPoint(ctx, y * scale, x * scale, 5, color);
  }
}


export function drawCircle(ctx, y, x, r, color, line_width)
{
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.lineWidth = line_width;
    ctx.strokeStyle = color;
    ctx.stroke();
}

export function drawTick(ctx, centerY, centerX)
{
  var radius = 90;
  //draw circle
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
  ctx.fillStyle = 'green';
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.strokeStyle = '#fff';
  ctx.stroke();

  //draw tick
  ctx.beginPath();
  ctx.moveTo(centerX-35,centerY);
  ctx.lineTo(centerX-10,centerY+25);
  ctx.lineTo(centerX+40,centerY-25);
  ctx.lineWidth = 20;
  ctx.strokeStyle = '#fff';
  ctx.stroke();

}

export function startGame()
{
  min = 0;
  sec = 0;
  document.getElementById("time_display").innerHTML = "00:00";
  document.getElementById("startButton").style.display='none';
  document.getElementById("time_display").style.display='block';
  setupQuestion();
  intervalVal = setInterval(updateTime, 1000);
}

function endGame()
{
  clearInterval(intervalVal);
  document.getElementById("startButton").style.display='block';
  document.getElementById("time_display").style.display='none';
  document.getElementById("gameOverModal").style.display='block';

  var min_text, sec_text;
  if(min < 10)
    min_text = "0" + min;
  else
    min_text = min;
  if(sec < 10)
    sec_text = "0" + sec;
  else
    sec_text = sec;
  document.getElementById("modalText").innerHTML ='Time used: ' + min_text + ":" + sec_text;
}

function updateTime()
{
  if(++sec >= 60)
  {
    ++min;
    sec -= 60;
  }
  var min_text, sec_text;
  if(min < 10)
    min_text = "0" + min;
  else
    min_text = min;
  if(sec < 10)
    sec_text = "0" + sec;
  else
    sec_text = sec;
  document.getElementById("time_display").innerHTML = min_text + ":" + sec_text;
}

export function checkPoseY(keypoints, minConfidence, ctx, scale = 1)
{
    const keypointRightWrist = keypoints[9];
    const keypointLeftWrist = keypoints[10];
    const keypointRightShoulder = keypoints[5];

    if (keypointLeftWrist.score < minConfidence) {
      return;
    }
    if (keypointRightWrist.score < minConfidence) {
      return;
    }
    if (keypointRightShoulder.score < minConfidence) {
      return;
    }

    var {y, x} = keypointLeftWrist.position;
    var yLeftWrist = y;
    var xLeftWrist = x;
    var {y, x} = keypointRightWrist.position;
    var yRightWrist = y;
    var xRightWrist = x;
    var {y, x} = keypointRightShoulder.position;
    var yRightShoulder = y;

    if(yRightWrist - yLeftWrist < 50 && xRightWrist - xLeftWrist > 300 && yRightShoulder - yRightWrist > 80)
    {
      //drawCircle(ctx, 250 * scale, 300 * scale, 120, 'red', 30);
      drawTick(ctx, 250 * scale, 300 * scale);
      correct = true;
      correct_time = new Date().getTime();
    }
}

export function checkSwagPose(keypoints, minConfidence, ctx, scale = 1)
{
    const keypointRightWrist = keypoints[9];
    const keypointLeftWrist = keypoints[10];
    const keypointRightShoulder = keypoints[5];
    const keypointLeftShoulder = keypoints[6];
    const keypointRightElbow = keypoints[7];
    const keypointLeftElbow = keypoints[8];

    if (keypointLeftWrist.score < minConfidence
      || keypointRightWrist.score < minConfidence
      || keypointRightShoulder.score < minConfidence
      || keypointLeftShoulder.score < minConfidence
      || keypointRightElbow < minConfidence
      || keypointLeftElbow < minConfidence) 
    {
      return;
    }

    var {y, x} = keypointLeftWrist.position;
    var yLeftWrist = y;
    var xLeftWrist = x;
    var {y, x} = keypointRightWrist.position;
    var yRightWrist = y;
    var xRightWrist = x;
    var {y, x} = keypointRightShoulder.position;
    var yRightShoulder = y;
    var xRightShoulder = x;
    var {y, x} = keypointLeftShoulder.position;
    var yLeftShoulder = y;
    var xLeftShoulder = x;
    var {y, x} = keypointRightElbow.position;
    var yRightElbow = y;
    var xRightElbow = x;
    var {y, x} = keypointLeftElbow.position;
    var yLeftElbow = y;
    var xLeftElbow = x;

    var shoulderWidth = xRightShoulder - xLeftShoulder;

    if(yRightWrist < yRightShoulder && xRightWrist < xRightShoulder //for right-handed
      && xRightElbow > xRightShoulder
      && xLeftShoulder - xLeftElbow > 0.5*shoulderWidth
      && xLeftElbow - xLeftWrist > 0.5*shoulderWidth
      && yLeftShoulder - yLeftWrist > 0.3*shoulderWidth)
    {
      //drawCircle(ctx, 250 * scale, 300 * scale, 120, 'red', 30);
      drawTick(ctx, 250 * scale, 300 * scale);
      correct = true;
      correct_time = new Date().getTime();
    }
    else if(yLeftWrist < yLeftShoulder && xLeftWrist > xLeftShoulder //for left-handed
      && xLeftElbow < xLeftShoulder
      && xRightElbow - xRightShoulder > 0.5*shoulderWidth
      && xRightWrist - xRightElbow > 0.5*shoulderWidth
      && yRightShoulder - yRightWrist > 0.3*shoulderWidth)
    {
      //drawCircle(ctx, 250 * scale, 300 * scale, 120, 'red', 30);
      drawTick(ctx, 250 * scale, 300 * scale);
      correct = true;
      correct_time = new Date().getTime();
    }
}

export function checkSupermanPose(keypoints, minConfidence, ctx, scale = 1)
{
    const keypointRightWrist = keypoints[9];
    const keypointLeftWrist = keypoints[10];
    const keypointRightShoulder = keypoints[5];
    const keypointLeftShoulder = keypoints[6];
    const keypointRightElbow = keypoints[7];
    const keypointLeftElbow = keypoints[8];

    if (keypointLeftWrist.score < minConfidence
      || keypointRightWrist.score < minConfidence
      || keypointRightShoulder.score < minConfidence
      || keypointLeftShoulder.score < minConfidence
      || keypointRightElbow < minConfidence
      || keypointLeftElbow < minConfidence) 
    {
      return;
    }

    var {y, x} = keypointLeftWrist.position;
    var yLeftWrist = y;
    var xLeftWrist = x;
    var {y, x} = keypointRightWrist.position;
    var yRightWrist = y;
    var xRightWrist = x;
    var {y, x} = keypointRightShoulder.position;
    var yRightShoulder = y;
    var xRightShoulder = x;
    var {y, x} = keypointLeftShoulder.position;
    var yLeftShoulder = y;
    var xLeftShoulder = x;
    var {y, x} = keypointRightElbow.position;
    var yRightElbow = y;
    var xRightElbow = x;
    var {y, x} = keypointLeftElbow.position;
    var yLeftElbow = y;
    var xLeftElbow = x;

    var shoulderWidth = xRightShoulder - xLeftShoulder;

    if(yRightWrist > yRightShoulder && yRightElbow > yRightWrist //for right-handed
      && xRightWrist < xRightShoulder && xRightElbow > xRightShoulder
      && xLeftShoulder - xLeftElbow > 0.5*shoulderWidth
      && xLeftElbow - xLeftWrist > 0.5*shoulderWidth
      && yLeftShoulder - yLeftWrist > 0.3*shoulderWidth)
    {
      //drawCircle(ctx, 250 * scale, 300 * scale, 120, 'red', 30);
      drawTick(ctx, 250 * scale, 300 * scale);
      correct = true;
      correct_time = new Date().getTime();
    }
    else if(yLeftWrist > yLeftShoulder && yRightElbow > yRightWrist //for left-handed
      && xLeftWrist > xLeftShoulder && xLeftElbow < xLeftShoulder
      && xRightElbow - xRightShoulder > 0.5*shoulderWidth
      && xRightWrist - xRightElbow > 0.5*shoulderWidth
      && yRightShoulder - yRightWrist > 0.3*shoulderWidth)
    {
      //drawCircle(ctx, 250 * scale, 300 * scale, 120, 'red', 30);
      drawTick(ctx, 250 * scale, 300 * scale);
      correct = true;
      correct_time = new Date().getTime();
    }
}

export function checkRespectPose(keypoints, minConfidence, ctx, scale = 1)
{
    const keypointRightWrist = keypoints[9];
    const keypointLeftWrist = keypoints[10];
    const keypointRightShoulder = keypoints[5];
    const keypointLeftShoulder = keypoints[6];
    const keypointRightElbow = keypoints[7];
    const keypointLeftElbow = keypoints[8];

    if (keypointLeftWrist.score < minConfidence
      || keypointRightWrist.score < minConfidence
      || keypointRightShoulder.score < minConfidence
      || keypointLeftShoulder.score < minConfidence
      || keypointRightElbow < minConfidence
      || keypointLeftElbow < minConfidence) 
    {
      return;
    }

    var {y, x} = keypointLeftWrist.position;
    var yLeftWrist = y;
    var xLeftWrist = x;
    var {y, x} = keypointRightWrist.position;
    var yRightWrist = y;
    var xRightWrist = x;
    var {y, x} = keypointRightShoulder.position;
    var yRightShoulder = y;
    var xRightShoulder = x;
    var {y, x} = keypointLeftShoulder.position;
    var yLeftShoulder = y;
    var xLeftShoulder = x;
    var {y, x} = keypointRightElbow.position;
    var yRightElbow = y;
    var xRightElbow = x;
    var {y, x} = keypointLeftElbow.position;
    var yLeftElbow = y;
    var xLeftElbow = x;

    var shoulderWidth = xRightShoulder - xLeftShoulder;

    if(yRightShoulder - yRightWrist > 0.3*shoulderWidth && yRightElbow > yRightWrist //for right-handed
      && xRightWrist > xRightShoulder && xRightElbow > xRightWrist)
    {
      //drawCircle(ctx, 250 * scale, 300 * scale, 120, 'red', 30);
      drawTick(ctx, 250 * scale, 300 * scale);
      correct = true;
      correct_time = new Date().getTime();
    }
    else if(yLeftShoulder - yLeftWrist > 0.3*shoulderWidth && yLeftElbow > yLeftWrist //for left-handed
      && xLeftWrist < xLeftShoulder && xLeftElbow < xLeftWrist)
    {
      //drawCircle(ctx, 250 * scale, 300 * scale, 120, 'red', 30);
      drawTick(ctx, 250 * scale, 300 * scale);
      correct = true;
      correct_time = new Date().getTime();
    }
}

export function checkViolinPose(keypoints, minConfidence, ctx, scale = 1)
{
    const keypointRightWrist = keypoints[9];
    const keypointLeftWrist = keypoints[10];
    const keypointRightShoulder = keypoints[5];
    const keypointLeftShoulder = keypoints[6];
    const keypointRightElbow = keypoints[7];
    const keypointLeftElbow = keypoints[8];

    if (keypointLeftWrist.score < minConfidence
      || keypointRightWrist.score < minConfidence
      || keypointRightShoulder.score < minConfidence
      || keypointLeftShoulder.score < minConfidence
      || keypointRightElbow < minConfidence
      || keypointLeftElbow < minConfidence) 
    {
      return;
    }

    var {y, x} = keypointLeftWrist.position;
    var yLeftWrist = y;
    var xLeftWrist = x;
    var {y, x} = keypointRightWrist.position;
    var yRightWrist = y;
    var xRightWrist = x;
    var {y, x} = keypointRightShoulder.position;
    var yRightShoulder = y;
    var xRightShoulder = x;
    var {y, x} = keypointLeftShoulder.position;
    var yLeftShoulder = y;
    var xLeftShoulder = x;
    var {y, x} = keypointRightElbow.position;
    var yRightElbow = y;
    var xRightElbow = x;
    var {y, x} = keypointLeftElbow.position;
    var yLeftElbow = y;
    var xLeftElbow = x;

    var shoulderWidth = xRightShoulder - xLeftShoulder;

    if(yRightElbow - yRightShoulder > 0.3*shoulderWidth && yRightElbow > yRightWrist //for right-handed
      && xRightShoulder - xRightWrist > 0.3*shoulderWidth && xRightElbow > xRightWrist
      && xLeftShoulder - xLeftWrist > 0.5*shoulderWidth
      && xLeftElbow - xLeftWrist > 0.3*shoulderWidth
      && yLeftElbow - yLeftWrist > 0.3*shoulderWidth)
    {
      //drawCircle(ctx, 250 * scale, 300 * scale, 120, 'red', 30);
      drawTick(ctx, 250 * scale, 300 * scale);
      correct = true;
      correct_time = new Date().getTime();
    }
}

export function checkModelPose(keypoints, minConfidence, ctx, scale = 1)
{
    const keypointRightWrist = keypoints[9];
    const keypointLeftWrist = keypoints[10];
    const keypointRightShoulder = keypoints[5];
    const keypointLeftShoulder = keypoints[6];
    const keypointRightElbow = keypoints[7];
    const keypointLeftElbow = keypoints[8];

    if (keypointLeftWrist.score < minConfidence
      || keypointRightWrist.score < minConfidence
      || keypointRightShoulder.score < minConfidence
      || keypointLeftShoulder.score < minConfidence
      || keypointRightElbow < minConfidence
      || keypointLeftElbow < minConfidence) 
    {
      return;
    }

    var {y, x} = keypointLeftWrist.position;
    var yLeftWrist = y;
    var xLeftWrist = x;
    var {y, x} = keypointRightWrist.position;
    var yRightWrist = y;
    var xRightWrist = x;
    var {y, x} = keypointRightShoulder.position;
    var yRightShoulder = y;
    var xRightShoulder = x;
    var {y, x} = keypointLeftShoulder.position;
    var yLeftShoulder = y;
    var xLeftShoulder = x;
    var {y, x} = keypointRightElbow.position;
    var yRightElbow = y;
    var xRightElbow = x;
    var {y, x} = keypointLeftElbow.position;
    var yLeftElbow = y;
    var xLeftElbow = x;

    var shoulderWidth = xRightShoulder - xLeftShoulder;

    if(yRightWrist - yRightShoulder > 0.7*shoulderWidth //for right-handed
      && yRightElbow < yRightWrist && yRightShoulder < yRightWrist
      && Math.abs(xRightWrist - xRightShoulder) < 0.3*shoulderWidth 
      && xRightElbow - xRightShoulder > 0.5*shoulderWidth)
    {
      //drawCircle(ctx, 250 * scale, 300 * scale, 120, 'red', 30);
      drawTick(ctx, 250 * scale, 300 * scale);
      correct = true;
      correct_time = new Date().getTime();
    }
    else if(yLeftWrist - yLeftShoulder > 0.7*shoulderWidth //for left-handed
      && yLeftElbow < yLeftWrist && yLeftShoulder < yLeftWrist
      && Math.abs(xLeftWrist - xLeftShoulder) < 0.3*shoulderWidth 
      && xLeftShoulder - xLeftElbow > 0.5*shoulderWidth)
    {
      //drawCircle(ctx, 250 * scale, 300 * scale, 120, 'red', 30);
      drawTick(ctx, 250 * scale, 300 * scale);
      correct = true;
      correct_time = new Date().getTime();
    }
}

//setup the question
export function setupQuestion()
{
  question_cnt = 0;
  questions = [];
  questions.push("Make a 'Y' pose");
  questions.push("Swag");
  questions.push("Superman");
  questions.push("Respect");
  questions.push("Playing Violin");
  questions.push("I'm a model");
  /*****************
  can push more questions, and remember to add check function for the pose added.
  modify checkQuestionPose() and add the check function for the question.
  ********************/

  correct = false;
  nextQuestion();
}

export function nextQuestion()
{
  correct = false;
  if(questions.length == 0)
  {
    cur_question = "";
    //document.getElementById("question").innerHTML = "No more question";
    document.getElementById("question").innerHTML = "";
    endGame();
    return;
  }
  question_cnt = question_cnt + 1;
  //get one random question from list
  var id = Math.floor(Math.random()*questions.length);
  cur_question = questions[id];

  //remove the question from list
  var arr1 = questions.slice(0,id);
  var arr2 = questions.slice(id+1);
  questions = arr1.concat(arr2);

  document.getElementById("question").innerHTML = "Q" + question_cnt + ": " + cur_question;
}

export function checkQuestionPose(keypoints, minConfidence, ctx, scale = 1)
{
  if(cur_question == "Make a 'Y' pose")
    checkPoseY(keypoints, minConfidence, ctx, scale);
  else if(cur_question == "Swag")
    checkSwagPose(keypoints, minConfidence, ctx, scale);
  else if(cur_question == "Superman")
    checkSupermanPose(keypoints, minConfidence, ctx, scale);
  else if(cur_question == "Respect")
    checkRespectPose(keypoints, minConfidence, ctx, scale);
  else if(cur_question == "Playing Violin")
    checkViolinPose(keypoints, minConfidence, ctx, scale);
  else if(cur_question == "I'm a model")
    checkModelPose(keypoints, minConfidence, ctx, scale);
}

/**
 * Draw the bounding box of a pose. For example, for a whole person standing
 * in an image, the bounding box will begin at the nose and extend to one of
 * ankles
 */
export function drawBoundingBox(keypoints, ctx) {
  const boundingBox = posenet.getBoundingBox(keypoints);

  ctx.rect(
      boundingBox.minX, boundingBox.minY, boundingBox.maxX - boundingBox.minX,
      boundingBox.maxY - boundingBox.minY);

  ctx.strokeStyle = boundingBoxColor;
  ctx.stroke();
}

/**
 * Converts an arary of pixel data into an ImageData object
 */
export async function renderToCanvas(a, ctx) {
  const [height, width] = a.shape;
  const imageData = new ImageData(width, height);

  const data = await a.data();

  for (let i = 0; i < height * width; ++i) {
    const j = i * 4;
    const k = i * 3;

    imageData.data[j + 0] = data[k + 0];
    imageData.data[j + 1] = data[k + 1];
    imageData.data[j + 2] = data[k + 2];
    imageData.data[j + 3] = 255;
  }

  ctx.putImageData(imageData, 0, 0);
}

/**
 * Draw an image on a canvas
 */
export function renderImageToCanvas(image, size, canvas) {
  canvas.width = size[0];
  canvas.height = size[1];
  const ctx = canvas.getContext('2d');

  ctx.drawImage(image, 0, 0);
}

/**
 * Draw heatmap values, one of the model outputs, on to the canvas
 * Read our blog post for a description of PoseNet's heatmap outputs
 * https://medium.com/tensorflow/real-time-human-pose-estimation-in-the-browser-with-tensorflow-js-7dd0bc881cd5
 */
export function drawHeatMapValues(heatMapValues, outputStride, canvas) {
  const ctx = canvas.getContext('2d');
  const radius = 5;
  const scaledValues = heatMapValues.mul(tf.scalar(outputStride, 'int32'));

  drawPoints(ctx, scaledValues, radius, color);
}

/**
 * Used by the drawHeatMapValues method to draw heatmap points on to
 * the canvas
 */
function drawPoints(ctx, points, radius, color) {
  const data = points.buffer().values;

  for (let i = 0; i < data.length; i += 2) {
    const pointY = data[i];
    const pointX = data[i + 1];

    if (pointX !== 0 && pointY !== 0) {
      ctx.beginPath();
      ctx.arc(pointX, pointY, radius, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
    }
  }
}

/**
 * Draw offset vector values, one of the model outputs, on to the canvas
 * Read our blog post for a description of PoseNet's offset vector outputs
 * https://medium.com/tensorflow/real-time-human-pose-estimation-in-the-browser-with-tensorflow-js-7dd0bc881cd5
 */
export function drawOffsetVectors(
    heatMapValues, offsets, outputStride, scale = 1, ctx) {
  const offsetPoints =
      posenet.singlePose.getOffsetPoints(heatMapValues, outputStride, offsets);

  const heatmapData = heatMapValues.buffer().values;
  const offsetPointsData = offsetPoints.buffer().values;

  for (let i = 0; i < heatmapData.length; i += 2) {
    const heatmapY = heatmapData[i] * outputStride;
    const heatmapX = heatmapData[i + 1] * outputStride;
    const offsetPointY = offsetPointsData[i];
    const offsetPointX = offsetPointsData[i + 1];

    drawSegment(
        [heatmapY, heatmapX], [offsetPointY, offsetPointX], color, scale, ctx);
  }
}
