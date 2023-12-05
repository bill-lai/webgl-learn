import { getSceneNodeByConfig } from "../scene-graph"

export const boxSize = 10
export const figureNodes = getSceneNodeByConfig({
  // 腰部动全身跟着动
  name: 'waist',
  trs: { translate: [-boxSize/2, 0] },
  children: [
    {
      // 躯干连接头部，颈部，双手
      name: 'torso',
      trs: { translate: [0, 2*boxSize] },
      children: [
        {
          // 颈部，连接头部
          name: 'neck',
          trs: { translate: [0, boxSize] },
          children: [{ name: 'head', trs: { translate: [0, boxSize] } }]
        },
        {
          // 左手，连接手臂和手掌
          name: 'leftArm',
          trs: { translate: [-boxSize, 0] },
          children: [
            // 手臂
            {
              name: 'leftFoream',
              trs: { translate: [-boxSize, 0] },
              // 左手
              children:[
                { name: 'leftHand', trs: {translate: [-boxSize, 0]} }
              ]
            }
          ]
        },
        {
          // 右手，连接手臂和手掌
          name: 'rightArm',
          trs: { translate: [boxSize, 0] },
          children: [
            // 手臂
            {
              name: 'rightFoream',
              trs: { translate: [boxSize, 0] },
              // 左手
              children:[
                { name: 'rightHand', trs: {translate: [boxSize, 0]} }
              ]
            }
          ]
        }
      ]
    },
    {
      // 左脚，连接脚臂和脚掌
      name: 'leftLeg',
      trs: { translate: [-boxSize, -boxSize] },
      children: [
        // 手臂
        {
          name: 'leftCalf',
          trs: { translate: [0, -boxSize] },
          // 左手
          children:[
            { name: 'leftFoot', trs: {translate: [0, -boxSize]} }
          ]
        }
      ]
    },
    {
      // 左脚，连接脚臂和脚掌
      name: 'rightLeg',
      trs: { translate: [boxSize, -boxSize] },
      children: [
        // 脚臂
        {
          name: 'rightCalf',
          trs: { translate: [0, -boxSize] },
          // 脚张
          children:[
            { name: 'rightFoot', trs: {translate: [0, -boxSize]} }
          ]
        }
      ]
    },
  ]
})