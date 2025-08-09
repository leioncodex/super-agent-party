import * as THREE from 'three/webgpu';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { VRMLoaderPlugin, MToonMaterialLoaderPlugin, VRMUtils, VRMLookAt } from '@pixiv/three-vrm';
import { MToonNodeMaterial } from '@pixiv/three-vrm/nodes';
import { createVRMAnimationClip, VRMAnimationLoaderPlugin } from '@pixiv/three-vrm-animation';
let isVRM1 = true;
let currentMixer = null;
let idleAction = null;
let breathAction = null;
let blinkAction = null;
let speechAnimationManager = null; // 新的语音动画管理器
let speechTimer = null;
let isInSpeechMode = false;
let speechTimeout = 5000; // 5秒超时
// renderer
// 检测运行环境
const isElectron = typeof require !== 'undefined' || navigator.userAgent.includes('Electron');

// 根据环境添加 class
document.body.classList.add(isElectron ? 'electron' : 'web');

// 优化渲染器设置
const renderer = new THREE.WebGPURenderer({
    alpha: true,
    premultipliedAlpha: true,
    antialias: true,  // 添加抗锯齿
    powerPreference: "high-performance",  // 使用高性能GPU
    forceWebGL: false  // 确保使用WebGPU
});

// 添加性能优化设置
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // 限制像素比例
renderer.setClearColor(0x00000000, 0);

// 用fetch查询/cur_language的值
async function fetchLanguage() {
    try {
        const http_protocol = window.location.protocol;
        const HOST = window.location.host;
        let res = await fetch(`${http_protocol}//${HOST}/cur_language`);
        const data = await res.json();
        return data.language;
    } catch (error) {
        console.error('Error fetching language:', error);
        return 'zh-CN';
    }
}
async function t(key) {
    const currentLanguage = await fetchLanguage();
    return translations[currentLanguage][key] || key;
}
// 用fetch查询/cur_language的值
async function fetchVRMConfig() {
    try {
        const http_protocol = window.location.protocol;
        const HOST = window.location.host;
        let res = await fetch(`${http_protocol}//${HOST}/vrm_config`);
        const data = await res.json();
        return data.VRMConfig;
    } catch (error) {
        console.error('Error fetching VRMConfig:', error);
        return   {
            enabledExpressions: false,
            selectedModelId: 'alice', // 默认选择Alice模型
            defaultModels: [], // 存储默认模型
            userModels: []     // 存储用户上传的模型
        };
    }
}

async function getVRMpath() {
    const vrmConfig = await fetchVRMConfig();
    const modelId = vrmConfig.selectedModelId;
    const defaultModel = vrmConfig.defaultModels.find(model => model.id === modelId) || vrmConfig.userModels.find(model => model.id === modelId);
    if (defaultModel) {
        return defaultModel.path;
    } else {
        const userModel = vrmConfig.userModels.find(model => model.id === modelId);
        if (userModel) {
            return userModel.path;
        }
        else {
            return `${window.location.protocol}//${window.location.host}/vrm/Alice.vrm`;
        }
    }
}

async function getVRMname() {
    const vrmConfig = await fetchVRMConfig();
    const modelId = vrmConfig.selectedModelId;
    const defaultModel = vrmConfig.defaultModels.find(model => model.id === modelId) || vrmConfig.userModels.find(model => model.id === modelId);
    if (defaultModel) {
        return defaultModel.name;
    } else {
        const userModel = vrmConfig.userModels.find(model => model.id === modelId);
        if (userModel) {
            return userModel.name;
        }
        else {
            return 'Alice';
        }
    }
}

const vrmPath = await getVRMpath();
console.log(vrmPath);

// 启用阴影（如果需要）
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

document.body.appendChild( renderer.domElement );

// camera
const camera = new THREE.PerspectiveCamera( 30.0, window.innerWidth / window.innerHeight, 0.1, 20.0 );
camera.position.set( 0.0, 1.0, 5.0 );

// camera controls
const controls = new OrbitControls( camera, renderer.domElement );
controls.screenSpacePanning = true;
controls.target.set( 0.0, 1.0, 0.0 );
controls.update();

// scene
const scene = new THREE.Scene();

// light
const light = new THREE.DirectionalLight( 0xffffff, Math.PI );
light.position.set( 1.0, 1.0, 1.0 ).normalize();
scene.add( light );

// lookat target
const lookAtTarget = new THREE.Object3D();
camera.add( lookAtTarget );

// 添加环境光，让整体更柔和
const ambientLight = new THREE.AmbientLight( 0xffffff, 0.1 );
scene.add( ambientLight );

// gltf and vrm
let currentVrm = undefined;
const loader = new GLTFLoader();
loader.crossOrigin = 'anonymous';

loader.register( ( parser ) => {
    // 创建 WebGPU 兼容的 MToonMaterialLoaderPlugin
    const mtoonMaterialPlugin = new MToonMaterialLoaderPlugin( parser, {
        materialType: MToonNodeMaterial,
    } );

    return new VRMLoaderPlugin( parser, {
        mtoonMaterialPlugin,
        // 确保启用所有功能
        autoUpdateHumanBones: true,
    } );
} );

loader.register( ( parser ) => {
    return new VRMAnimationLoaderPlugin( parser );
} );

// 设置自然姿势的函数
function setNaturalPose(vrm) {
    if (!vrm.humanoid) return;
    let v = 1;
    if (!isVRM1){
        v = -1;
    }
    // 左臂自然下垂
    vrm.humanoid.getNormalizedBoneNode( 'leftUpperArm' ).rotation.z = -0.4 * Math.PI * v;

    // 右臂自然下垂
    vrm.humanoid.getNormalizedBoneNode( 'rightUpperArm' ).rotation.z = 0.4 * Math.PI * v;
    
    const leftHand = vrm.humanoid.getNormalizedBoneNode('leftHand');
    if (leftHand) {
        leftHand.rotation.z = 0.1 * v; // 手腕自然弯曲
        leftHand.rotation.x = 0.05;
    }
    const rightHand = vrm.humanoid.getNormalizedBoneNode('rightHand');
    if (rightHand) {
        rightHand.rotation.z = -0.1 * v; // 手腕自然弯曲
        rightHand.rotation.x = 0.05;
    }
    // 添加手指的自然弯曲（如果模型支持）
    const fingerBones = [
        'leftThumbProximal', 'leftThumbIntermediate', 'leftThumbDistal',
        'leftIndexProximal', 'leftIndexIntermediate', 'leftIndexDistal',
        'leftMiddleProximal', 'leftMiddleIntermediate', 'leftMiddleDistal',
        'leftRingProximal', 'leftRingIntermediate', 'leftRingDistal',
        'leftLittleProximal', 'leftLittleIntermediate', 'leftLittleDistal',
        'rightThumbProximal', 'rightThumbIntermediate', 'rightThumbDistal',
        'rightIndexProximal', 'rightIndexIntermediate', 'rightIndexDistal',
        'rightMiddleProximal', 'rightMiddleIntermediate', 'rightMiddleDistal',
        'rightRingProximal', 'rightRingIntermediate', 'rightRingDistal',
        'rightLittleProximal', 'rightLittleIntermediate', 'rightLittleDistal'
    ];

    fingerBones.forEach(boneName => {
        const bone = vrm.humanoid.getNormalizedBoneNode(boneName);
        if (bone) {
            // 根据手指部位设置不同的弯曲度
            if (boneName.includes('Thumb')) {
                // 拇指稍微向内
                bone.rotation.y = boneName.includes('left') ? 0.35 : -0.35;
            } else if (boneName.includes('Proximal')) {
                // 近端指骨轻微弯曲
                bone.rotation.z = boneName.includes('left') ? -0.35 * v : 0.35 * v;
            } else if (boneName.includes('Intermediate')) {
                // 中端指骨稍微弯曲
                bone.rotation.z = boneName.includes('left') ? -0.45 * v : 0.45 * v;
            } else if (boneName.includes('Distal')) {
                // 远端指骨轻微弯曲
                bone.rotation.z = boneName.includes('left') ? -0.3 * v : 0.3 * v;
            }
        }
    });
}

// 闲置动作的时间偏移量，让各个动作不同步
const idleOffsets = {
    body: Math.random() * Math.PI * 2,
    leftArm: Math.random() * Math.PI * 2,
    rightArm: Math.random() * Math.PI * 2,
    head: Math.random() * Math.PI * 2,
    spine: Math.random() * Math.PI * 2
};

// 在全局变量区域添加 - 改进后的闲置动画管理
let idleAnimations = [];
let currentIdleAnimationIndex = 0;
let idleAnimationAction = null;
let isLoadingAnimations = false;
let idleAnimationManager = null; // 新的闲置动画管理器
let defaultPoseAction = null; // 默认姿势动作

// 闲置动画管理器类 - 完全独立版本
class IdleAnimationManager {
    constructor(vrm, mixer) {
        this.vrm = vrm;
        this.mixer = mixer;
        this.currentIdleAction = null;
        this.defaultPoseAction = null;
        this.proceduralIdleAction = null;
        this.isTransitioning = false;
        this.animationQueue = [];
        this.currentIndex = 0;
        this.transitionDuration = 1.0;
        this.pauseBetweenAnimations = 1.0;
        this.idleWeight = 1.0; // 固定权重，不会改变
        
        // 创建默认姿势动作
        this.createDefaultPoseAction();
        // 创建程序化闲置动画
        this.createProceduralIdleAction();
    }
    
    // 创建默认姿势动作
    createDefaultPoseAction() {
        const defaultPoseClip = this.createDefaultPoseClip();
        this.defaultPoseAction = this.mixer.clipAction(defaultPoseClip);
        this.defaultPoseAction.setLoop(THREE.LoopOnce);
        this.defaultPoseAction.clampWhenFinished = true;
        this.defaultPoseAction.setEffectiveWeight(0);
    }
    
    // 创建程序化闲置动画
    createProceduralIdleAction() {
        const idleClip = createIdleClip(this.vrm);
        this.proceduralIdleAction = this.mixer.clipAction(idleClip);
        this.proceduralIdleAction.setLoop(THREE.LoopRepeat);
        this.proceduralIdleAction.setEffectiveWeight(0);
    }
    
    // 创建默认姿势的clip
    createDefaultPoseClip() {
        const tracks = [];
        const duration = 1.0;
        const fps = 30;
        const frameCount = duration * fps;
        
        const times = [];
        for (let i = 0; i <= frameCount; i++) {
            times.push(i / fps);
        }
        
        // 需要重置的骨骼 - 只包含不影响口型和表情的骨骼
        const bonesToReset = [
            'spine', 'chest', 'upperChest', 'neck',
            'leftUpperArm', 'leftLowerArm', 'leftHand', 'leftShoulder',
            'rightUpperArm', 'rightLowerArm', 'rightHand', 'rightShoulder',
            'leftUpperLeg', 'leftLowerLeg', 'leftFoot',
            'rightUpperLeg', 'rightLowerLeg', 'rightFoot',
            // 手指骨骼
            'leftThumbProximal', 'leftThumbIntermediate', 'leftThumbDistal',
            'leftIndexProximal', 'leftIndexIntermediate', 'leftIndexDistal',
            'leftMiddleProximal', 'leftMiddleIntermediate', 'leftMiddleDistal',
            'leftRingProximal', 'leftRingIntermediate', 'leftRingDistal',
            'leftLittleProximal', 'leftLittleIntermediate', 'leftLittleDistal',
            'rightThumbProximal', 'rightThumbIntermediate', 'rightThumbDistal',
            'rightIndexProximal', 'rightIndexIntermediate', 'rightIndexDistal',
            'rightMiddleProximal', 'rightMiddleIntermediate', 'rightMiddleDistal',
            'rightRingProximal', 'rightRingIntermediate', 'rightRingDistal',
            'rightLittleProximal', 'rightLittleIntermediate', 'rightLittleDistal'
        ];
        
        bonesToReset.forEach(boneName => {
            const bone = this.vrm.humanoid.getNormalizedBoneNode(boneName);
            if (!bone) return;
            
            const naturalRotation = this.getNaturalRotation(boneName);
            const values = [];
            
            times.forEach(() => {
                values.push(...naturalRotation.toArray());
            });
            
            const track = new THREE.QuaternionKeyframeTrack(
                bone.name + '.quaternion',
                times,
                values
            );
            
            tracks.push(track);
        });
        
        return new THREE.AnimationClip('defaultPose', duration, tracks);
    }
    
    // 获取自然姿势的旋转值
    getNaturalRotation(boneName) {
        const euler = new THREE.Euler(0, 0, 0);
        const v = isVRM1 ? 1 : -1;
        
        switch (boneName) {
            case 'leftUpperArm':
                euler.set(0, 0, -0.4 * Math.PI * v);
                break;
            case 'rightUpperArm':
                euler.set(0, 0, 0.4 * Math.PI * v);
                break;
            case 'leftHand':
                euler.set(0.05, 0, 0.1 * v);
                break;
            case 'rightHand':
                euler.set(0.05, 0, -0.1 * v);
                break;
            case 'leftShoulder':
                euler.set(0, 0, 0);
                break;
            case 'rightShoulder':
                euler.set(0, 0, 0);
                break;
            // 手指的自然姿势
            case 'leftThumbProximal':
            case 'rightThumbProximal':
                euler.set(0, boneName.includes('left') ? 0.35 : -0.35, 0);
                break;
            case 'leftIndexProximal':
            case 'leftMiddleProximal':
            case 'leftRingProximal':
            case 'leftLittleProximal':
                euler.set(0, 0, -0.35 * v);
                break;
            case 'rightIndexProximal':
            case 'rightMiddleProximal':
            case 'rightRingProximal':
            case 'rightLittleProximal':
                euler.set(0, 0, 0.35 * v);
                break;
            case 'leftIndexIntermediate':
            case 'leftMiddleIntermediate':
            case 'leftRingIntermediate':
            case 'leftLittleIntermediate':
                euler.set(0, 0, -0.45 * v);
                break;
            case 'rightIndexIntermediate':
            case 'rightMiddleIntermediate':
            case 'rightRingIntermediate':
            case 'rightLittleIntermediate':
                euler.set(0, 0, 0.45 * v);
                break;
            case 'leftIndexDistal':
            case 'leftMiddleDistal':
            case 'leftRingDistal':
            case 'leftLittleDistal':
                euler.set(0, 0, -0.3 * v);
                break;
            case 'rightIndexDistal':
            case 'rightMiddleDistal':
            case 'rightRingDistal':
            case 'rightLittleDistal':
                euler.set(0, 0, 0.3 * v);
                break;
            default:
                euler.set(0, 0, 0);
                break;
        }
        
        const quaternion = new THREE.Quaternion();
        quaternion.setFromEuler(euler);
        return quaternion;
    }
    
    // 设置动画队列
    setAnimationQueue(animations) {
        this.animationQueue = animations;
        this.currentIndex = 0;
        console.log(`Idle animation queue set with ${animations.length} animations`);
    }
    
    // 开始闲置动画循环
    startIdleLoop() {
        if (this.animationQueue.length === 0) {
            console.warn('No idle animations available, using procedural animation');
            this.startProceduralIdleOnly();
            return;
        }
        
        console.log('Starting idle animation loop');
        this.playNextAnimation();
    }
    
    // 仅启动程序化闲置动画（备用方案）
    startProceduralIdleOnly() {
        if (this.proceduralIdleAction) {
            this.proceduralIdleAction.setEffectiveWeight(this.idleWeight);
            this.proceduralIdleAction.play();
            console.log('Started procedural idle animation only');
        }
    }
    
    // 播放下一个动画
    playNextAnimation() {
        if (this.animationQueue.length === 0) {
            this.startProceduralIdleOnly();
            return;
        }
        
        // 如果正在过渡中，等待过渡完成
        if (this.isTransitioning) {
            setTimeout(() => this.playNextAnimation(), 100);
            return;
        }
        
        const animation = this.animationQueue[this.currentIndex];
        console.log(`Playing idle animation: ${animation.name} (${this.currentIndex + 1}/${this.animationQueue.length})`);
        
        this.playIdleAnimation(animation);
        
        // 更新索引（循环）
        this.currentIndex = (this.currentIndex + 1) % this.animationQueue.length;
    }
    
    // 播放指定的闲置动画
    playIdleAnimation(animationData) {
        if (!animationData || !animationData.animation) {
            console.error('Invalid animation data');
            this.scheduleNextAnimation();
            return;
        }
        
        try {
            // 创建VRM动画剪辑
            const clip = createVRMAnimationClip(animationData.animation, this.vrm);
            if (!clip) {
                console.error('Failed to create animation clip');
                this.scheduleNextAnimation();
                return;
            }
            
            // 停止当前闲置动画（如果有）
            if (this.currentIdleAction) {
                this.currentIdleAction.fadeOut(this.transitionDuration * 0.5);
            }
            
            // 创建新的动作
            this.currentIdleAction = this.mixer.clipAction(clip);
            this.currentIdleAction.setLoop(THREE.LoopOnce);
            this.currentIdleAction.clampWhenFinished = true;
            this.currentIdleAction.setEffectiveWeight(this.idleWeight); // 固定权重
            
            // 淡入播放
            this.currentIdleAction.reset();
            this.currentIdleAction.fadeIn(this.transitionDuration * 0.5);
            this.currentIdleAction.play();
            
            // 监听动画结束事件
            const onFinished = (event) => {
                if (event.action === this.currentIdleAction) {
                    console.log(`Idle animation ${animationData.name} finished`);
                    this.onAnimationFinished();
                    this.mixer.removeEventListener('finished', onFinished);
                }
            };
            
            this.mixer.addEventListener('finished', onFinished);
            
        } catch (error) {
            console.error(`Error playing idle animation ${animationData.name}:`, error);
            this.scheduleNextAnimation();
        }
    }
    
    // 动画结束后的处理
    onAnimationFinished() {
        console.log('Idle animation finished, transitioning to default pose');
        
        this.isTransitioning = true;
        
        // 淡出当前动画，淡入默认姿势
        if (this.currentIdleAction) {
            this.currentIdleAction.fadeOut(this.transitionDuration);
        }
        
        // 播放默认姿势过渡
        this.defaultPoseAction.reset();
        this.defaultPoseAction.setEffectiveWeight(this.idleWeight * 0.5); // 固定权重
        this.defaultPoseAction.fadeIn(this.transitionDuration);
        this.defaultPoseAction.play();
        
        // 在默认姿势播放一段时间后，开始下一个动画
        setTimeout(() => {
            this.defaultPoseAction.fadeOut(this.transitionDuration * 0.5);
            this.isTransitioning = false;
            
            // 延迟后播放下一个动画
            setTimeout(() => {
                this.playNextAnimation();
            }, this.pauseBetweenAnimations * 1000);
            
        }, this.pauseBetweenAnimations * 1000);
    }
    
    // 移除权重调整方法 - 闲置动画完全独立运行
    // adjustWeight() 方法已删除
    
    // 停止所有闲置动画（仅在必要时使用，如模型切换）
    stopAllIdle() {
        console.log('Stopping all idle animations');
        
        if (this.currentIdleAction) {
            this.currentIdleAction.fadeOut(0.5);
            this.currentIdleAction.stop();
            this.currentIdleAction = null;
        }
        
        if (this.proceduralIdleAction) {
            this.proceduralIdleAction.fadeOut(0.5);
            this.proceduralIdleAction.stop();
        }
        
        if (this.defaultPoseAction) {
            this.defaultPoseAction.fadeOut(0.5);
            this.defaultPoseAction.stop();
        }
        
        this.isTransitioning = false;
        console.log('All idle animations stopped');
    }
    
    // 安排下一个动画（错误恢复用）
    scheduleNextAnimation() {
        setTimeout(() => {
            this.playNextAnimation();
        }, this.pauseBetweenAnimations * 1000);
    }
    
    // 获取当前状态信息（调试用）
    getStatus() {
        return {
            isTransitioning: this.isTransitioning,
            hasCurrentIdleAction: !!this.currentIdleAction,
            hasProceduralIdleAction: !!this.proceduralIdleAction,
            animationQueueLength: this.animationQueue.length,
            currentIndex: this.currentIndex,
            idleWeight: this.idleWeight // 显示固定权重
        };
    }
    
    // 强制重置到默认状态
    forceReset() {
        console.log('Force resetting idle animation manager');
        this.stopAllIdle();
        
        // 重置状态
        this.isTransitioning = false;
        this.currentIndex = 0;
        
        // 重新创建动作
        this.createDefaultPoseAction();
        this.createProceduralIdleAction();
        
        // 应用默认姿势
        this.defaultPoseAction.reset();
        this.defaultPoseAction.setEffectiveWeight(this.idleWeight);
        this.defaultPoseAction.play();
        
        console.log('Idle animation manager reset complete');
    }
}

// 获取动画目录下的所有VRMA文件
async function getAnimationFiles() {
    try {
        const animationDir = `${window.location.protocol}//${window.location.host}/vrm/animations/`;
        
        // 这里需要一个API来获取目录下的文件列表
        // 你可能需要在后端添加一个接口来返回动画文件列表
        const response = await fetch(`${window.location.protocol}//${window.location.host}/api/animation-files`);
        
        if (response.ok) {
            const files = await response.json();
            return files.filter(file => file.endsWith('.vrma')).map(file => `${animationDir}${file}`);
        } else {
            // 如果没有API，使用预定义的文件列表
            return [
                `${animationDir}test.vrma`,
                // 添加更多已知的动画文件
            ];
        }
    } catch (error) {
        console.error('Error getting animation files:', error);
        // 返回默认动画文件
        return [`${window.location.protocol}//${window.location.host}/vrm/animations/test.vrma`];
    }
}

// 加载VRMA动画文件
async function loadVRMAAnimation(url) {
    return new Promise((resolve, reject) => {
        loader.load(
            url,
            (gltf) => {
                const vrmAnimations = gltf.userData.vrmAnimations;
                if (vrmAnimations && vrmAnimations.length > 0) {
                    resolve(vrmAnimations[0]);
                } else {
                    reject(new Error('No VRM animation found in file'));
                }
            },
            (progress) => {
                console.log(`Loading animation ${url}...`, 100.0 * (progress.loaded / progress.total), '%');
            },
            (error) => {
                console.error(`Error loading animation ${url}:`, error);
                reject(error);
            }
        );
    });
}

// 加载所有闲置动画
async function loadIdleAnimations() {
    if (isLoadingAnimations) return;
    isLoadingAnimations = true;
    
    console.log('Loading idle animations...');
    
    try {
        const animationFiles = await getAnimationFiles();
        idleAnimations = [];
        
        for (const file of animationFiles) {
            try {
                const animation = await loadVRMAAnimation(file);
                idleAnimations.push({
                    animation: animation,
                    file: file,
                    name: file.split('/').pop().replace('.vrma', '')
                });
                console.log(`Loaded animation: ${file}`);
            } catch (error) {
                console.warn(`Failed to load animation: ${file}`, error);
            }
        }
        
        console.log(`Successfully loaded ${idleAnimations.length} idle animations`);
        
    } catch (error) {
        console.error('Error loading idle animations:', error);
    } finally {
        isLoadingAnimations = false;
    }
}

// 开始闲置动画循环 - 改进版
async function startIdleAnimationLoop() {
    if (idleAnimations.length === 0) {
        await loadIdleAnimations();
    }
    
    if (idleAnimations.length > 0) {
        // 使用新的闲置动画管理器
        if (idleAnimationManager) {
            idleAnimationManager.setAnimationQueue(idleAnimations);
            idleAnimationManager.startIdleLoop();
        }
    } else {
        console.warn('No idle animations available, using procedural animation');
        // 回退到原始的程序化闲置动画
        useProceduralIdleAnimation();
    }
}

// 程序化闲置动画（作为备用）
function useProceduralIdleAnimation() {
    if (!currentVrm) return;
    
    const idleClip = createIdleClip(currentVrm);
    idleAction = currentMixer.clipAction(idleClip);
    idleAction.setLoop(THREE.LoopRepeat);
    idleAction.play();
}

// 生成闲置动画 clip - 改进版
function createIdleClip(vrm) {
    const tracks = [];
    const fps = 30;
    const duration = 600;
    const frameCount = duration * fps;
    
    // 生成时间数组
    const times = [];
    for (let i = 0; i <= frameCount; i++) {
        times.push(i / fps);
    }
    
    // VRM版本检测
    const v = (vrm.meta.metaVersion === '1') ? 1 : -1;
    
    // 需要动画的骨骼列表
    const animatedBones = [
        'spine', 'chest', 'neck', 'head',
        'leftUpperArm', 'leftLowerArm', 'leftHand', 'leftShoulder',
        'rightUpperArm', 'rightLowerArm', 'rightHand', 'rightShoulder'
    ];
    
    animatedBones.forEach(boneName => {
        const bone = vrm.humanoid.getNormalizedBoneNode(boneName);
        if (!bone) return;
        
        const values = [];
        
        // 为每个时间点计算旋转值
        times.forEach(time => {
            let euler = new THREE.Euler(0, 0, 0);
            
            // 使用周期性函数，确保在 t=0 和 t=duration 时值相同
            // 将所有频率调整为 duration 的倍数，确保完美循环
            const cycleTime = (time / duration) * 80 * Math.PI; // 0 到 2π
            
            switch (boneName) {
                case 'spine':
                    // 使用更平滑的周期函数
                    euler.set(
                        Math.sin(cycleTime * 0.6 + idleOffsets.body) * 0.02,     
                        0,                                                    
                        Math.cos(cycleTime * 0.5 + idleOffsets.body) * 0.015    
                    );
                    break;
                    
                case 'chest':
                    euler.set(
                        Math.sin(cycleTime * 0.6 + idleOffsets.body) * 0.01,     
                        0,                                                    
                        Math.cos(cycleTime * 0.5 + idleOffsets.body) * 0.0075   
                    );
                    break;
                    
                case 'neck':
                    euler.set(
                        Math.cos(cycleTime * 1.2 + idleOffsets.head) * 0.01,     
                        Math.sin(cycleTime * 1.4 + idleOffsets.head) * 0.02,     
                        0                                                     
                    );
                    break;
                    
                case 'head':
                    euler.set(
                        Math.sin(cycleTime * 1.0 + idleOffsets.head) * 0.02,     
                        Math.sin(cycleTime * 1.4 + idleOffsets.head) * 0.03,     
                        Math.cos(cycleTime * 0.8 + idleOffsets.head) * 0.01      
                    );
                    break;
                    
                case 'leftUpperArm':
                    euler.set(
                        Math.cos(cycleTime * 0.7 + idleOffsets.leftArm) * 0.03, 
                        Math.sin(cycleTime * 0.6 + idleOffsets.leftArm) * 0.02,  
                        -0.43 * Math.PI * v + Math.sin(cycleTime * 1.5 + idleOffsets.leftArm) * 0.03 - 0.01 
                    );
                    break;
                    
                case 'leftLowerArm':
                    euler.set(
                        0,                                                   
                        0,                                                   
                        -Math.sin(cycleTime * 1.5 + idleOffsets.leftArm) * 0.02 
                    );
                    break;
                    
                case 'leftHand':
                    euler.set(
                        0.05,                                                
                        0,                                                   
                        0.1 * v + Math.sin(cycleTime * 1.2 + idleOffsets.leftArm) * 0.015 
                    );
                    break;
                    
                case 'leftShoulder':
                    euler.set(
                        0,                                                   
                        0,                                                   
                        Math.sin(cycleTime * 0.7 + idleOffsets.leftArm) * 0.02 
                    );
                    break;
                    
                case 'rightUpperArm':
                    euler.set(
                        Math.cos(cycleTime * 0.8 + idleOffsets.rightArm) * 0.03,  
                        Math.sin(cycleTime * 0.64 + idleOffsets.rightArm) * 0.02, 
                        0.43 * Math.PI * v + Math.sin(cycleTime * 1.5 + idleOffsets.rightArm) * 0.03 
                    );
                    break;
                    
                case 'rightLowerArm':
                    euler.set(
                        0,                                                    
                        0,                                                    
                        -Math.sin(cycleTime * 1.5 + idleOffsets.rightArm) * 0.02 
                    );
                    break;
                    
                case 'rightHand':
                    euler.set(
                        0.05,                                                 
                        0,                                                    
                        -0.1 * v - Math.sin(cycleTime * 1.2 + idleOffsets.rightArm) * 0.015 
                    );
                    break;
                    
                case 'rightShoulder':
                    euler.set(
                        0,                                                    
                        Math.sin(cycleTime * 0.8 + idleOffsets.rightArm) * 0.02  
                    );
                    break;
                    
                default:
                    euler.set(0, 0, 0);
                    break;
            }
            
            // 将欧拉角转换为四元数并添加到值数组
            const quaternion = new THREE.Quaternion();
            quaternion.setFromEuler(euler);
            values.push(...quaternion.toArray());
        });
        
        // 创建四元数关键帧轨道
        const track = new THREE.QuaternionKeyframeTrack(
            bone.name + '.quaternion',
            times,
            values
        );
        
        tracks.push(track);
    });
    
    // 创建并返回动画剪辑
    return new THREE.AnimationClip('idle', duration, tracks);
}

function createBreathClip(vrm) {
    const tracks = [];
    const duration = 4; // 4秒一个呼吸周期
    const fps = 30;
    const frameCount = duration * fps;
    
    const times = [];
    for (let i = 0; i <= frameCount; i++) {
        times.push(i / fps);
    }
    
    // 呼吸缩放动画
    const scaleValues = [];
    times.forEach(time => {
        const breathScale = 1 + Math.sin(time * Math.PI / 2) * 0.003; // 更自然的呼吸节奏
        scaleValues.push(breathScale, breathScale, breathScale);
    });
    
    const scaleTrack = new THREE.VectorKeyframeTrack(
        vrm.scene.name + '.scale',
        times,
        scaleValues
    );
    
    tracks.push(scaleTrack);
    return new THREE.AnimationClip('breath', duration, tracks);
}

function createBlinkClip(vrm) {
    if (!vrm.expressionManager) return null;
    
    const tracks = [];
    const duration = 6; // 6秒周期，包含随机间隔
    const fps = 30;
    const frameCount = duration * fps;
    
    const times = [];
    for (let i = 0; i <= frameCount; i++) {
        times.push(i / fps);
    }
    
    // 创建眨眼模式：在随机时间点眨眼
    const blinkValues = [];
    times.forEach(time => {
        let blinkValue = 0;
        
        // 在第1.5秒单次眨眼
        if (time >= 1.4 && time <= 1.6) {
            const progress = (time - 1.4) / 0.2;
            blinkValue = Math.sin(progress * Math.PI);
        }
        // 在第4秒双次眨眼
        else if (time >= 3.8 && time <= 4.4) {
            const localTime = time - 3.8;
            if (localTime < 0.15) {
                blinkValue = Math.sin((localTime / 0.15) * Math.PI);
            } else if (localTime > 0.25 && localTime < 0.4) {
                blinkValue = Math.sin(((localTime - 0.25) / 0.15) * Math.PI);
            }
        }
        
        blinkValues.push(blinkValue);
    });
    
    const blinkTrack = new THREE.NumberKeyframeTrack(
        vrm.expressionManager.getExpressionTrackName('blink'),
        times,
        blinkValues
    );
    
    tracks.push(blinkTrack);
    return new THREE.AnimationClip('blink', duration, tracks);
}

// 修改 createSpeechClip 函数 - 创建一个足够长的clip
function createSpeechClip(vrm, expressions = []) {
    if (!vrm.expressionManager) return null;
    
    const tracks = [];
    const maxDuration = 30; // 创建一个30秒的长clip，足够应对大部分情况
    const fps = 30;
    const frameCount = maxDuration * fps;
    
    const times = [];
    for (let i = 0; i <= frameCount; i++) {
        times.push(i / fps);
    }
    
    // 口型动画 - 使用智能模拟
    const mouthValues = [];
    const mouthIhValues = [];
    
    times.forEach((time, index) => {
        // 使用多个频率叠加，模拟真实语音的复杂性
        const baseFreq = 12 + Math.sin(time * 0.5) * 4;
        const intensity1 = Math.sin(time * baseFreq) * 0.5 + 0.5;
        const intensity2 = Math.sin(time * baseFreq * 1.3 + 0.5) * 0.3 + 0.3;
        const intensity3 = Math.sin(time * baseFreq * 0.7 + 1.2) * 0.2 + 0.2;
        
        const combinedIntensity = (intensity1 + intensity2 + intensity3) / 3;
        const randomFactor = 0.8 + Math.random() * 0.4;
        const finalIntensity = combinedIntensity * randomFactor;
        
        let mouthOpen = 0;
        let mouthIh = 0;
        
        if (finalIntensity > 0.15) {
            mouthOpen = Math.min(Math.max(finalIntensity * 0.8, 0.1), 0.5);
            const variation = Math.sin(time * 12 + index * 0.1) * 0.1;
            mouthIh = Math.min(Math.max(0, finalIntensity * 0.3 + variation), 0.3);
        } else {
            // 渐进关闭
            const prevMouthOpen = index > 0 ? mouthValues[index - 1] || 0 : 0;
            const prevMouthIh = index > 0 ? mouthIhValues[index - 1] || 0 : 0;
            
            mouthOpen = Math.max(0, prevMouthOpen * 0.9 - 0.1);
            mouthIh = Math.max(0, prevMouthIh * 0.85 - 0.1);
        }
        
        mouthValues.push(mouthOpen);
        mouthIhValues.push(mouthIh);
    });
    
    // 创建口型轨道
    const mouthTrack = new THREE.NumberKeyframeTrack(
        vrm.expressionManager.getExpressionTrackName('aa'),
        times,
        mouthValues
    );
    tracks.push(mouthTrack);
    
    const mouthIhTrack = new THREE.NumberKeyframeTrack(
        vrm.expressionManager.getExpressionTrackName('ih'),
        times,
        mouthIhValues
    );
    tracks.push(mouthIhTrack);
    
    // 处理表情
    if (expressions.length > 0) {
        const expression = expressions[0].replace(/<|>/g, '');
        const expressionValues = [];
        let max_mouthOpen = 0.5;
        
        times.forEach((time, index) => {
            let value = 0;
            
            if (['happy', 'angry', 'sad', 'neutral', 'relaxed'].includes(expression)) {
                value = 1.0;
                if (expression === 'happy') {
                    max_mouthOpen = 0.1;
                }
            } else if (expression === 'surprised') {
                value = time < 2 ? 1.0 : 0.0;
                max_mouthOpen = 0.1;
            } else if (['blink', 'blinkLeft', 'blinkRight'].includes(expression)) {
                const totalFrames = fps * 2;
                const halfFrames = totalFrames / 2;
                
                if (index < halfFrames) {
                    value = Math.min(index / halfFrames + 0.3 , 1);
                } else if (index < totalFrames) {
                    value = Math.max(1 - ((index - halfFrames) / halfFrames), 0);
                } else {
                    value = 0;
                }
            }
            
            expressionValues.push(value);
        });
        
        // 根据表情调整口型幅度
        if (max_mouthOpen < 0.5) {
            for (let i = 0; i < mouthValues.length; i++) {
                mouthValues[i] = Math.min(mouthValues[i], max_mouthOpen);
                mouthIhValues[i] = Math.min(mouthIhValues[i], max_mouthOpen);
            }
            
            // 重新创建口型轨道
            tracks[0] = new THREE.NumberKeyframeTrack(
                vrm.expressionManager.getExpressionTrackName('aa'),
                times,
                mouthValues
            );
            tracks[1] = new THREE.NumberKeyframeTrack(
                vrm.expressionManager.getExpressionTrackName('ih'),
                times,
                mouthIhValues
            );
        }
        
        const expressionTrack = new THREE.NumberKeyframeTrack(
            vrm.expressionManager.getExpressionTrackName(expression),
            times,
            expressionValues
        );
        tracks.push(expressionTrack);
    }
    
    return new THREE.AnimationClip('speech', maxDuration, tracks);
}

// 修改后的语音动画管理器类 - 完全独立版本
class SpeechAnimationManager {
    constructor(vrm, mixer) {
        this.vrm = vrm;
        this.mixer = mixer;
        this.activeActions = new Map();
        this.speechClip = null;
        
        // 预创建语音clip
        this.createBaseSpeechClip();
    }
    
    createBaseSpeechClip() {
        this.speechClip = createSpeechClip(this.vrm, []);
    }
    
    startSpeech(chunkId, expressions = []) {
        console.log(`Starting speech for chunk ${chunkId}`);
        
        // 移除对闲置动画的任何干预
        // 语音播放时不再通知闲置动画管理器
        
        // 停止之前的动画
        if (this.activeActions.has(chunkId)) {
            this.stopSpeech(chunkId);
        }
        
        // 创建带表情的clip
        const clip = createSpeechClip(this.vrm, expressions);
        if (!clip) return;
        
        const action = this.mixer.clipAction(clip);
        action.setLoop(THREE.LoopOnce);
        action.clampWhenFinished = true;
        action.setEffectiveWeight(1.0); // 语音动画保持全权重
        
        action.play();
        
        // 存储action和开始时间
        this.activeActions.set(chunkId, {
            action: action,
            clip: clip,
            startTime: Date.now(),
            expressions: expressions
        });
        
        console.log(`Speech animation started for chunk ${chunkId}`);
    }
    
    stopSpeech(chunkId) {
        const actionData = this.activeActions.get(chunkId);
        if (!actionData) return;
        
        console.log(`Stopping speech for chunk ${chunkId}`);
        
        // 淡出并停止
        actionData.action.fadeOut(0.1);
        
        setTimeout(() => {
            actionData.action.stop();
            this.activeActions.delete(chunkId);
            
            // 如果没有其他语音在播放，重置表情
            if (this.activeActions.size === 0) {
                this.resetExpressions();
            }
        }, 100);
    }
    
    stopAllSpeech() {
        console.log('Stopping all speech animations');
        
        for (const chunkId of this.activeActions.keys()) {
            this.stopSpeech(chunkId);
        }
    }
    
    resetExpressions() {
        if (this.vrm && this.vrm.expressionManager) {
            this.vrm.expressionManager.resetValues();
            console.log('All speech expressions reset');
        }
    }
    
    // 检查是否有活跃的语音动画
    hasActiveSpeech() {
        return this.activeActions.size > 0;
    }
}


let VRMname = await getVRMname();
showModelSwitchingIndicator(VRMname);
loader.load(

    // URL of the VRM you want to load
    vrmPath,

    // called when the resource is loaded
    ( gltf ) => {

        const vrm = gltf.userData.vrm;
        currentMixer = new THREE.AnimationMixer(vrm.scene); // 创建动画混合器
        isVRM1 = vrm.meta.metaVersion === '1';
        VRMUtils.rotateVRM0(vrm); // 旋转 VRM 使其面向正前方
        // calling these functions greatly improves the performance
        VRMUtils.removeUnnecessaryVertices( gltf.scene );
        VRMUtils.combineSkeletons( gltf.scene );
        VRMUtils.combineMorphs( vrm );

        // 启用 Spring Bone 物理模拟
        if (vrm.springBoneManager) {
            console.log('Spring Bone Manager found:', vrm.springBoneManager);
            // Spring Bone 会在 vrm.update() 中自动更新
        }


        // Disable frustum culling
        vrm.scene.traverse( ( obj ) => {

            obj.frustumCulled = false;

        } );

        vrm.lookAt.target = camera;
        currentVrm = vrm;
        console.log( vrm );
        scene.add( vrm.scene );

        // 设置自然姿势
        setNaturalPose(vrm);

        const breathClip = createBreathClip(vrm);
        breathAction = currentMixer.clipAction(breathClip);
        breathAction.setLoop(THREE.LoopRepeat);
        breathAction.play();

        const blinkClip = createBlinkClip(vrm);
        blinkAction = currentMixer.clipAction(blinkClip);
        blinkAction.setLoop(THREE.LoopRepeat);
        blinkAction.play();

        // 创建语音动画管理器
        speechAnimationManager = new SpeechAnimationManager(vrm, currentMixer);

        // 创建闲置动画管理器
        idleAnimationManager = new IdleAnimationManager(vrm, currentMixer);

        // 开始闲置动画循环
        startIdleAnimationLoop();

        hideModelSwitchingIndicator();
    },

    (progress) => {
        console.log('Loading model...', 100.0 * (progress.loaded / progress.total), '%');
        // 可以在这里更新加载进度
        updateModelLoadingProgress(progress.loaded / progress.total);
    },

    (error) => {
        console.error('Error loading model:', error);
        hideModelSwitchingIndicator();
        
        // 如果加载失败，尝试回到之前的模型
        if (allModels.length > 1) {
            console.log('Attempting to load fallback model...');
            // 尝试加载第一个模型作为备用
            if (currentModelIndex !== 0) {
                switchToModel(0);
            }
        }
    }

);

// 在全局变量区域添加字幕相关变量
let subtitleElement = null;
let currentSubtitleChunkIndex = -1;
let subtitleTimeout = null;
let isSubtitleEnabled = true; // 字幕默认开启
let isDraggingSubtitle = false;
let subtitleOffsetX = 0;
let subtitleOffsetY = 0;

// 修改初始化字幕元素
function initSubtitleElement() {
    subtitleElement = document.createElement('div');
    subtitleElement.id = 'subtitle-container';
    subtitleElement.style.cssText = `
        position: fixed;
        bottom: 30%;
        left: 50%;
        width: auto;
        max-width: 80%;
        transform: translateX(-50%);
        padding: 12px 24px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        border-radius: 8px;
        font-family: 'Arial', sans-serif;
        font-size: 1.2em;
        text-align: center;
        backdrop-filter: blur(10px);
        opacity: 0;
        transition: opacity 0.3s ease, transform 0.3s ease;
        z-index: 9998;
        white-space: pre-wrap;
        line-height: 1.5;
        cursor: move;
        user-select: none;
        min-width: 100px;
        max-width: 80%;
        width: max-content;
    `;

    // 添加拖拽事件监听
    subtitleElement.addEventListener('mousedown', startDragSubtitle);
    document.addEventListener('mousemove', dragSubtitle);
    document.addEventListener('mouseup', endDragSubtitle);

    document.body.appendChild(subtitleElement);
}

// 改进拖拽功能
function startDragSubtitle(e) {
    if (!isSubtitleEnabled) return;
    
    isDraggingSubtitle = true;
    
    // 获取字幕元素的初始位置
    const rect = subtitleElement.getBoundingClientRect();
    
    // 计算鼠标相对于字幕中心点的偏移量
    subtitleOffsetX = e.clientX - (rect.left + rect.width / 2);
    subtitleOffsetY = e.clientY - rect.top;
    
    // 禁用过渡效果
    subtitleElement.style.transition = 'none';
}

function dragSubtitle(e) {
    if (isDraggingSubtitle) {
        // 计算字幕中心点的目标位置
        const centerX = e.clientX - subtitleOffsetX;
        const centerY = e.clientY - subtitleOffsetY;
        
        // 限制在窗口范围内，保持水平居中
        const halfWidth = subtitleElement.offsetWidth / 2;
        const clampedX = Math.max(halfWidth, Math.min(centerX, window.innerWidth - halfWidth));
        
        // 设置位置时保持水平居中
        subtitleElement.style.left = `${clampedX}px`;
        subtitleElement.style.transform = 'translateX(-50%)'; // 水平居中
        
        // 垂直位置保持不变
        const maxY = window.innerHeight - subtitleElement.offsetHeight;
        const clampedY = Math.max(0, Math.min(centerY, maxY));
        
        subtitleElement.style.top = `${clampedY}px`;
        subtitleElement.style.bottom = 'auto'; // 取消底部定位
    }
}

function endDragSubtitle() {
    if (isDraggingSubtitle) {
        isDraggingSubtitle = false;
        subtitleElement.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    }
}

// 修改字幕显示/隐藏功能
function toggleSubtitle(enable) {
    isSubtitleEnabled = enable;
    if (subtitleElement) {
        subtitleElement.style.display = enable ? 'block' : 'none';
    }
}

function updateSubtitle(text, chunkIndex) {
    if (!isSubtitleEnabled) return;
    
    if (!subtitleElement) initSubtitleElement();
    
    currentSubtitleChunkIndex = chunkIndex;
    
    subtitleElement.style.opacity = '0';
    setTimeout(() => {
        subtitleElement.textContent = text;
        
        // 自动调整宽度
        const maxWidth = window.innerWidth * 0.8;
        subtitleElement.style.width = 'max-content';
        subtitleElement.style.minWidth = '100px';
        
        const rect = subtitleElement.getBoundingClientRect();
        if (rect.width > maxWidth) {
            subtitleElement.style.width = `${maxWidth}px`;
        }
        
        subtitleElement.style.opacity = '1';
    }, 300);
    
    if (subtitleTimeout) clearTimeout(subtitleTimeout);
}

// 清除字幕
function clearSubtitle() {
    if (subtitleElement) {
        subtitleElement.style.opacity = '0';
        currentSubtitleChunkIndex = -1;
    }
}

// animate
const clock = new THREE.Clock();
clock.start();

// 在animate函数中替换原来的眨眼动画代码
function animate() {
    requestAnimationFrame(animate);
    
    const deltaTime = clock.getDelta();
    
    if (currentVrm) {
        // 只需要更新 VRM 和 Mixer
        currentVrm.update(deltaTime);
    }
    
    if (currentMixer) {
        currentMixer.update(deltaTime);
    }
    
    renderer.renderAsync(scene, camera);
    
    // 处理窗口大小变化时字幕位置
    if (subtitleElement && !isDraggingSubtitle) {
        const rect = subtitleElement.getBoundingClientRect();
        
        // 如果字幕在窗口外，重置到默认位置
        if (rect.bottom > window.innerHeight || rect.right > window.innerWidth) {
            subtitleElement.style.left = '50%';
            subtitleElement.style.bottom = '30%';
            subtitleElement.style.top = 'auto';
            subtitleElement.style.transform = 'translateX(-50%)';
        }
    }
}
     

// 在控制面板中添加字幕开关按钮
if (isElectron) {
    setTimeout(async () => {
        const controlPanel = document.getElementById('control-panel');
        if (controlPanel) {
            // 字幕开关按钮
            const subtitleButton = document.createElement('div');
            subtitleButton.id = 'subtitle-handle';
            subtitleButton.innerHTML = '<i class="fas fa-closed-captioning"></i>';
            subtitleButton.style.cssText = `
                width: 36px;
                height: 36px;
                background: rgba(255,255,255,0.95);
                border: 2px solid rgba(0,0,0,0.1);
                border-radius: 50%;
                color: #333;
                cursor: pointer;
                -webkit-app-region: no-drag;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 14px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                transition: all 0.2s ease;
                user-select: none;
                pointer-events: auto;
                backdrop-filter: blur(10px);
                color: ${isSubtitleEnabled ? '#28a745' : '#dc3545'};
            `;

            // 添加悬停效果
            subtitleButton.addEventListener('mouseenter', () => {
                subtitleButton.style.background = 'rgba(255,255,255,1)';
                subtitleButton.style.transform = 'scale(1.1)';
                subtitleButton.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)';
            });

            subtitleButton.addEventListener('mouseleave', () => {
                subtitleButton.style.background = 'rgba(255,255,255,0.95)';
                subtitleButton.style.transform = 'scale(1)';
                subtitleButton.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            });

            // 点击事件
            subtitleButton.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                isSubtitleEnabled = !isSubtitleEnabled;
                toggleSubtitle(isSubtitleEnabled);
                subtitleButton.style.color = isSubtitleEnabled ? '#28a745' : '#dc3545';
                subtitleButton.title = isSubtitleEnabled ? await t('SubtitleEnabled') : await t('SubtitleDisabled');
            });

            // 初始状态
            subtitleButton.title = isSubtitleEnabled ? await t('SubtitleEnabled') : await t('SubtitleDisabled');

            // 添加到控制面板
            const prevModelButton = controlPanel.querySelector('#prev-model-handle');
            if (prevModelButton) {
                controlPanel.insertBefore(subtitleButton, prevModelButton);
            } else {
                controlPanel.appendChild(subtitleButton);
            }
        }
    }, 1400);
}

if (isElectron) {
    // 等待一小段时间确保页面完全加载
    setTimeout(() => {
        // 创建控制面板容器
        const controlPanel = document.createElement('div');
        controlPanel.id = 'control-panel';
        controlPanel.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        z-index: 9999;
        opacity: 0;
        visibility: hidden;
        transform: translateX(20px);
        transition: all 0.3s ease;
        pointer-events: none;
        `;
        
        // 拖拽按钮
        const dragButton = document.createElement('div');
        dragButton.id = 'drag-handle';
        dragButton.style.cssText = `
                width: 36px;
                height: 36px;
                background: rgba(255,255,255,0.95);
                border: 2px solid rgba(0,0,0,0.1);
                border-radius: 50%;
                color: #333;
                cursor: pointer;
                -webkit-app-region: drag;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 14px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                transition: all 0.2s ease;
                user-select: none;
                pointer-events: auto;
                backdrop-filter: blur(10px);
        `;

        // 创建一个内部拖拽区域来确保拖拽功能正常
        const dragArea = document.createElement('div');
        dragArea.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            -webkit-app-region: drag;
            z-index: 1;
        `;

        // 图标容器
        const iconContainer = document.createElement('div');
        iconContainer.innerHTML = '<el-icon class="logo-icon"><img src="./source/icon.png" /></el-icon>';
        iconContainer.style.cssText = `
            position: relative;
            z-index: 2;
            pointer-events: none;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 100%;
            -webkit-app-region: drag;
        `;

        // 直接设置img样式
        const img = iconContainer.querySelector('img');
        if (img) {
            img.style.cssText = `
                width: 24px;
                height: 24px;
                border: none;
                vertical-align: middle;
                object-fit: contain;
            `;
        }

        // 组装拖拽按钮
        dragButton.innerHTML = '';
        dragButton.appendChild(dragArea);
        dragButton.appendChild(iconContainer);
        
        // 刷新按钮
        const refreshButton = document.createElement('div');
        refreshButton.id = 'refresh-handle';
        refreshButton.innerHTML = '<i class="fas fa-redo-alt"></i>';
        refreshButton.style.cssText = `
                width: 36px;
                height: 36px;
                background: rgba(255,255,255,0.95);
                border: 2px solid rgba(0,0,0,0.1);
                border-radius: 50%;
                color: #333;
                cursor: pointer;
                -webkit-app-region: no-drag;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 14px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                transition: all 0.2s ease;
                user-select: none;
                pointer-events: auto;
                backdrop-filter: blur(10px);
        `;
        
        // 关闭按钮
        const closeButton = document.createElement('div');
        closeButton.id = 'close-handle';
        closeButton.innerHTML = '<i class="fas fa-times"></i>';
        closeButton.style.cssText = `
                width: 36px;
                height: 36px;
                background: rgba(255,255,255,0.95);
                border: 2px solid rgba(0,0,0,0.1);
                border-radius: 50%;
                color: #333;
                cursor: pointer;
                -webkit-app-region: no-drag;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 14px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                transition: all 0.2s ease;
                user-select: none;
                pointer-events: auto;
                backdrop-filter: blur(10px);
        `;
        
        // 添加悬停效果 - 刷新按钮
        refreshButton.addEventListener('mouseenter', () => {
            refreshButton.style.background = 'rgba(255,255,255,1)';
            refreshButton.style.transform = 'scale(1.1)';
            refreshButton.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)';
        });
        
        refreshButton.addEventListener('mouseleave', () => {
            refreshButton.style.background = 'rgba(255,255,255,0.95)';
            refreshButton.style.transform = 'scale(1)';
            refreshButton.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        });

        // 刷新按钮点击事件
        refreshButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            // 刷新页面
            window.location.reload();
        });
        
        // 添加悬停效果 - 关闭按钮
        closeButton.addEventListener('mouseenter', () => {
            closeButton.style.background = 'rgba(255,255,255,1)';
            closeButton.style.transform = 'scale(1.1)';
            closeButton.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)';
        });
        
        closeButton.addEventListener('mouseleave', () => {
            closeButton.style.background = 'rgba(255,255,255,0.95)';
            closeButton.style.transform = 'scale(1)';
            closeButton.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        });

        // 关闭按钮点击事件
        closeButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (window.electronAPI && window.electronAPI.stopVRMWindow) {
                window.electronAPI.stopVRMWindow();
            } else {
                // 备用方案：直接关闭窗口
                window.close();
            }
        });
        async function initbutton() {
            dragButton.title = await t('dragWindow');
            refreshButton.title = await t('refreshWindow');
            closeButton.title = await t('closeWindow');
        }
        initbutton();
        // 组装控制面板
        controlPanel.appendChild(dragButton);
        controlPanel.appendChild(refreshButton);
        controlPanel.appendChild(closeButton);
        
        // 添加到页面
        document.body.appendChild(controlPanel);
        
        // 显示/隐藏控制逻辑
        let hideTimeout;
        let isControlPanelHovered = false;
        
        // 显示控制面板
        function showControlPanel() {
            clearTimeout(hideTimeout);
            controlPanel.style.opacity = '1';
            controlPanel.style.visibility = 'visible';
            controlPanel.style.transform = 'translateX(0)';
            controlPanel.style.pointerEvents = 'auto';
        }
        
        // 隐藏控制面板
        function hideControlPanel() {
            if (!isControlPanelHovered) {
                controlPanel.style.opacity = '0';
                controlPanel.style.visibility = 'hidden';
                controlPanel.style.transform = 'translateX(20px)';
                controlPanel.style.pointerEvents = 'none';
            }
        }
        
        // 延迟隐藏控制面板
        function scheduleHide() {
            clearTimeout(hideTimeout);
            hideTimeout = setTimeout(hideControlPanel, 2000); // 2秒后隐藏
        }
        
        // 窗口鼠标进入事件
        document.body.addEventListener('mouseenter', () => {
            showControlPanel();
        });
        
        // 窗口鼠标移动事件（重置隐藏计时器）
        document.body.addEventListener('mousemove', () => {
            showControlPanel();
            scheduleHide();
        });
        
        // 窗口鼠标离开事件
        document.body.addEventListener('mouseleave', () => {
            if (!isControlPanelHovered) {
                scheduleHide();
            }
        });
        
        // 控制面板鼠标进入事件
        controlPanel.addEventListener('mouseenter', () => {
            isControlPanelHovered = true;
            clearTimeout(hideTimeout);
            showControlPanel();
        });
        
        // 控制面板鼠标离开事件
        controlPanel.addEventListener('mouseleave', () => {
            isControlPanelHovered = false;
            scheduleHide();
        });
        
        // 鼠标静止检测
        let mouseStopTimeout;
        document.body.addEventListener('mousemove', () => {
            clearTimeout(mouseStopTimeout);
            mouseStopTimeout = setTimeout(() => {
                if (!isControlPanelHovered) {
                    hideControlPanel();
                }
            }, 3000); // 鼠标静止3秒后隐藏
        });
        
        // 初始状态：隐藏控制面板
        scheduleHide();
        
        console.log('控制面板已添加到页面');
    }, 1000);
}

// 在全局变量区域添加
let ttsWebSocket = null;
let wsConnected = false;
let currentAudioContext = null;

// 初始化 WebSocket 连接
function initTTSWebSocket() {
    const http_protocol = window.location.protocol;
    const ws_protocol = http_protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${ws_protocol}//${window.location.host}/ws/vrm`;
    ttsWebSocket = new WebSocket(wsUrl);
    
    ttsWebSocket.onopen = () => {
        console.log('VRM TTS WebSocket connected');
        wsConnected = true;
        
        // 发送连接确认
        sendToMain('vrmConnected', { status: 'ready' });
    };
    
    ttsWebSocket.onmessage = (event) => {
        try {
            const message = JSON.parse(event.data);
            handleTTSMessage(message);
        } catch (error) {
            console.error('Error parsing WebSocket message:', error);
        }
    };
    
    ttsWebSocket.onclose = () => {
        console.log('VRM TTS WebSocket disconnected');
        wsConnected = false;
        
        // 自动重连
        setTimeout(() => {
            if (!wsConnected) {
                initTTSWebSocket();
            }
        }, 3000);
    };
    
    ttsWebSocket.onerror = (error) => {
        console.error('VRM TTS WebSocket error:', error);
    };
}
initTTSWebSocket();

// 发送消息到主界面
function sendToMain(type, data) {
    if (ttsWebSocket && wsConnected) {
        ttsWebSocket.send(JSON.stringify({
            type,
            data,
            timestamp: Date.now()
        }));
    }
}

// 修改 handleTTSMessage 函数
function handleTTSMessage(message) {
    const { type, data } = message;
    
    switch (type) {
        case 'ttsStarted':
            console.log('TTS started, preparing for speech animation');
            if (speechAnimationManager) {
                speechAnimationManager.stopAllSpeech();
            }
            clearSubtitle();
            break;
            
        case 'startSpeaking':
            console.log('Starting speech animation for chunk:', data.chunkIndex);
            if (data.text) {
                updateSubtitle(data.text, data.chunkIndex);
            }
            startLipSyncForChunk(data);
            break;
            
        case 'chunkEnded':
            console.log('Chunk ended:', data.chunkIndex);
            if (speechAnimationManager) {
                speechAnimationManager.stopSpeech(data.chunkIndex);
            }
            // 如果当前显示的是这个chunk的字幕，则清除
            if (currentSubtitleChunkIndex === data.chunkIndex) {
                clearSubtitle();
            }
            break;
            
        case 'stopSpeaking':
            console.log('Stopping speech animation');
            if (speechAnimationManager) {
                speechAnimationManager.stopAllSpeech();
            }
            break;
            
        case 'allChunksCompleted':
            console.log('All TTS chunks completed');
            if (speechAnimationManager) {
                speechAnimationManager.stopAllSpeech();
            }
            clearSubtitle();
            sendToMain('animationComplete', { status: 'completed' });
            break;
    }
}

// 修改 startLipSyncForChunk 函数
async function startLipSyncForChunk(data) {
    const chunkId = data.chunkIndex;
    
    if (!speechAnimationManager) {
        console.error('Speech animation manager not available');
        return;
    }
    
    try {
        // 使用新的管理器开始语音动画
        speechAnimationManager.startSpeech(chunkId, data.expressions || []);
        
        // 字幕处理
        if (data.text) {
            updateSubtitle(data.text, data.chunkIndex);
        }
        
    } catch (error) {
        console.error(`Error starting lip sync for chunk ${chunkId}:`, error);
    }
}

// 在 Electron 环境中添加 WebSocket 控制按钮
if (isElectron) {
    // 在现有的控制面板创建代码中添加 WebSocket 状态按钮
    setTimeout(() => {
        const controlPanel = document.getElementById('control-panel');
        if (controlPanel) {
            // WebSocket 状态按钮
            const wsStatusButton = document.createElement('div');
            wsStatusButton.id = 'ws-status-handle';
            wsStatusButton.innerHTML = '<i class="fas fa-wifi"></i>';
            wsStatusButton.style.cssText = `
                width: 36px;
                height: 36px;
                background: rgba(255,255,255,0.95);
                border: 2px solid rgba(0,0,0,0.1);
                border-radius: 50%;
                color: #333;
                cursor: pointer;
                -webkit-app-region: no-drag;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 14px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                transition: all 0.2s ease;
                user-select: none;
                pointer-events: auto;
                backdrop-filter: blur(10px);
                color: ${wsConnected ? '#28a745' : '#dc3545'};
            `;
            // WebSocket 状态按钮事件
            wsStatusButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (wsConnected) {
                    // 断开连接
                    if (ttsWebSocket) {
                        ttsWebSocket.close();
                    }
                } else {
                    // 重新连接
                    initTTSWebSocket();
                }
            });
            // 添加悬停效果
            wsStatusButton.addEventListener('mouseenter', () => {
                wsStatusButton.style.background = 'rgba(255,255,255,1)';
                wsStatusButton.style.transform = 'scale(1.1)';
                wsStatusButton.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)';
            });
            
            wsStatusButton.addEventListener('mouseleave', () => {
                wsStatusButton.style.background = 'rgba(255,255,255,0.95)';
                wsStatusButton.style.transform = 'scale(1)';
                wsStatusButton.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            });
            // 更新 WebSocket 状态显示
            async function updateWSStatus() {
                wsStatusButton.style.color = wsConnected ? '#28a745' : '#dc3545';
                wsStatusButton.title = wsConnected ? await t('WebSocketConnected') :await t('WebSocketDisconnected');
            }

            // 定期更新状态
            setInterval(updateWSStatus, 1000);
            
            // 添加到控制面板（在拖拽按钮后面）
            const dragButton = controlPanel.querySelector('#drag-handle');
            if (dragButton) {
                controlPanel.insertBefore(wsStatusButton, dragButton.nextSibling);
            } else {
                controlPanel.appendChild(wsStatusButton);
            }
        }
    }, 1200);
}

// 在页面加载完成后初始化 WebSocket
document.addEventListener('DOMContentLoaded', () => {
    // 延迟初始化，确保其他组件已经准备好
    setTimeout(() => {
        initTTSWebSocket();
    }, 2000);
});

if (isElectron) {
  // 禁用 Chromium 的自动播放限制
  const disableAutoplayPolicy = () => {
    if (window.chrome && chrome.webview) {
      chrome.webview.setAutoplayPolicy('no-user-gesture-required');
    }
  };
  
  // 在用户交互后执行
  document.addEventListener('click', () => {
    disableAutoplayPolicy();
    if (currentAudioContext) {
      currentAudioContext.resume();
    }
  });
}

// 在全局变量区域添加模型切换相关变量
let currentModelIndex = 0;
let allModels = [];
let modelsInitialized = false;

// 获取所有可用模型的函数（只执行一次）
async function getAllModels() {
    if (modelsInitialized) {
        return allModels;
    }
    
    const vrmConfig = await fetchVRMConfig();
    const defaultModels = vrmConfig.defaultModels || [];
    const userModels = vrmConfig.userModels || [];
    allModels = [...defaultModels, ...userModels];
    
    // 找到当前选中模型的索引
    const selectedModelId = vrmConfig.selectedModelId;
    currentModelIndex = Math.max(0, allModels.findIndex(model => model.id === selectedModelId));
    
    modelsInitialized = true;
    console.log(`Models initialized: ${allModels.length} models available, current index: ${currentModelIndex}`);
    
    return allModels;
}

// 切换到指定索引的模型（纯前端切换）
async function switchToModel(index) {
    if (!modelsInitialized) {
        await getAllModels();
    }
    
    if (allModels.length === 0) {
        console.error('No models available');
        return;
    }
    
    // 确保索引在有效范围内（循环切换）
    const newIndex = ((index % allModels.length) + allModels.length) % allModels.length;
    
    // 如果是同一个模型，不需要切换
    if (newIndex === currentModelIndex) {
        console.log('Same model selected, no need to switch');
        return;
    }
    
    currentModelIndex = newIndex;
    const selectedModel = allModels[currentModelIndex];
    
    console.log(`Switching to model: ${selectedModel.name} (${selectedModel.id}) - Index: ${currentModelIndex}`);
    
    try {
        // 显示加载提示（可选）
        showModelSwitchingIndicator(selectedModel.name);
        
        // 移除当前VRM模型
        if (currentVrm) {
            scene.remove(currentVrm.scene);
            currentVrm = undefined;
        }
        
        // 重置语音动画管理器
        speechAnimationManager = null;
        
        // 加载新模型
        const modelPath = selectedModel.path;
        
        loader.load(
            modelPath,
            (gltf) => {
                const vrm = gltf.userData.vrm;
                currentMixer = new THREE.AnimationMixer(vrm.scene); // 创建动画混合器
                isVRM1 = vrm.meta.metaVersion === '1';
                VRMUtils.rotateVRM0(vrm); // 旋转 VRM 使其面向正前方
                // 优化性能
                VRMUtils.removeUnnecessaryVertices(gltf.scene);
                VRMUtils.combineSkeletons(gltf.scene);
                VRMUtils.combineMorphs(vrm);
                
                // 启用 Spring Bone 物理模拟
                if (vrm.springBoneManager) {
                    console.log('Spring Bone Manager found:', vrm.springBoneManager);
                }
                
                // 禁用视锥体剔除
                vrm.scene.traverse((obj) => {
                    obj.frustumCulled = false;
                });
                
                vrm.lookAt.target = camera;
                currentVrm = vrm;
                console.log('New VRM loaded:', vrm);
                scene.add(vrm.scene);
                
                // 设置自然姿势
                setNaturalPose(vrm);

                const breathClip = createBreathClip(vrm);
                breathAction = currentMixer.clipAction(breathClip);
                breathAction.setLoop(THREE.LoopRepeat);
                breathAction.play();

                const blinkClip = createBlinkClip(vrm);
                blinkAction = currentMixer.clipAction(blinkClip);
                blinkAction.setLoop(THREE.LoopRepeat);
                blinkAction.play();

                // 创建语音动画管理器
                speechAnimationManager = new SpeechAnimationManager(vrm, currentMixer);
                
                startIdleAnimationLoop();

                // 隐藏加载提示
                hideModelSwitchingIndicator();
                
                console.log(`Successfully switched to model: ${selectedModel.name}`);
            },
            (progress) => {
                console.log('Loading model...', 100.0 * (progress.loaded / progress.total), '%');
                // 可以在这里更新加载进度
                updateModelLoadingProgress(progress.loaded / progress.total);
            },
            (error) => {
                console.error('Error loading model:', error);
                hideModelSwitchingIndicator();
                
                // 如果加载失败，尝试回到之前的模型
                if (allModels.length > 1) {
                    console.log('Attempting to load fallback model...');
                    // 尝试加载第一个模型作为备用
                    if (currentModelIndex !== 0) {
                        switchToModel(0);
                    }
                }
            }
        );
        
    } catch (error) {
        console.error('Error switching model:', error);
        hideModelSwitchingIndicator();
    }
}

// 显示模型切换指示器（可选功能）
function showModelSwitchingIndicator(modelName) {
    // 创建或显示加载提示
    let indicator = document.getElementById('model-switching-indicator');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'model-switching-indicator';
        indicator.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 20px;
            border-radius: 10px;
            font-size: 16px;
            z-index: 10000;
            text-align: center;
            backdrop-filter: blur(10px);
            transition: opacity 0.3s ease;
        `;
        document.body.appendChild(indicator);
    }
    
    indicator.innerHTML = `
        <div style="margin-bottom: 10px;">
            <i class="fas fa-sync-alt fa-spin"></i>
        </div>
        <div>Loading ${modelName}...</div>
        <div id="loading-progress" style="margin-top: 10px; font-size: 14px; opacity: 0.8;"></div>
    `;
    indicator.style.display = 'block';
    indicator.style.opacity = '1';
}

// 更新加载进度
function updateModelLoadingProgress(progress) {
    const progressElement = document.getElementById('loading-progress');
    if (progressElement) {
        progressElement.textContent = `${Math.round(progress * 100)}%`;
    }
}

// 隐藏模型切换指示器
function hideModelSwitchingIndicator() {
    const indicator = document.getElementById('model-switching-indicator');
    if (indicator) {
        indicator.style.opacity = '0';
        setTimeout(() => {
            indicator.style.display = 'none';
        }, 300);
    }
}

// 获取当前模型信息
function getCurrentModelInfo() {
    if (allModels.length > 0 && currentModelIndex >= 0 && currentModelIndex < allModels.length) {
        return allModels[currentModelIndex];
    }
    return null;
}

// 获取下一个模型信息（用于预览）
function getNextModelInfo() {
    if (allModels.length === 0) return null;
    const nextIndex = ((currentModelIndex + 1) % allModels.length + allModels.length) % allModels.length;
    return allModels[nextIndex];
}

// 获取上一个模型信息（用于预览）
function getPrevModelInfo() {
    if (allModels.length === 0) return null;
    const prevIndex = ((currentModelIndex - 1) % allModels.length + allModels.length) % allModels.length;
    return allModels[prevIndex];
}

// 在 Electron 环境中添加模型切换按钮
if (isElectron) {
    setTimeout(async () => {
        const controlPanel = document.getElementById('control-panel');
        if (controlPanel) {
            // 获取所有模型（只执行一次）
            await getAllModels();
            
            // 向上箭头按钮（切换到上一个模型）
            const prevModelButton = document.createElement('div');
            prevModelButton.id = 'prev-model-handle';
            prevModelButton.innerHTML = '<i class="fas fa-chevron-up"></i>';
            prevModelButton.style.cssText = `
                width: 36px;
                height: 36px;
                background: rgba(255,255,255,0.95);
                border: 2px solid rgba(0,0,0,0.1);
                border-radius: 50%;
                color: #333;
                cursor: pointer;
                -webkit-app-region: no-drag;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 14px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                transition: all 0.2s ease;
                user-select: none;
                pointer-events: auto;
                backdrop-filter: blur(10px);
            `;
            
            // 向下箭头按钮（切换到下一个模型）
            const nextModelButton = document.createElement('div');
            nextModelButton.id = 'next-model-handle';
            nextModelButton.innerHTML = '<i class="fas fa-chevron-down"></i>';
            nextModelButton.style.cssText = `
                width: 36px;
                height: 36px;
                background: rgba(255,255,255,0.95);
                border: 2px solid rgba(0,0,0,0.1);
                border-radius: 50%;
                color: #333;
                cursor: pointer;
                -webkit-app-region: no-drag;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 14px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                transition: all 0.2s ease;
                user-select: none;
                pointer-events: auto;
                backdrop-filter: blur(10px);
            `;
            
            // 添加悬停效果和工具提示 - 上一个模型按钮
            prevModelButton.addEventListener('mouseenter', async () => {
                prevModelButton.style.background = 'rgba(255,255,255,1)';
                prevModelButton.style.transform = 'scale(1.1)';
                prevModelButton.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)';
                
                // 显示下一个模型的名称
                const prevModel = getPrevModelInfo();
                if (prevModel) {
                    prevModelButton.title = `${await t('Previous')}: ${prevModel.name}`;
                }
            });
            
            prevModelButton.addEventListener('mouseleave', () => {
                prevModelButton.style.background = 'rgba(255,255,255,0.95)';
                prevModelButton.style.transform = 'scale(1)';
                prevModelButton.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            });
            
            // 添加悬停效果和工具提示 - 下一个模型按钮
            nextModelButton.addEventListener('mouseenter', async () => {
                nextModelButton.style.background = 'rgba(255,255,255,1)';
                nextModelButton.style.transform = 'scale(1.1)';
                nextModelButton.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)';
                
                // 显示下一个模型的名称
                const nextModel = getNextModelInfo();
                if (nextModel) {
                    nextModelButton.title = `${await t('Next')}: ${nextModel.name}`;
                }
            });
            
            nextModelButton.addEventListener('mouseleave', () => {
                nextModelButton.style.background = 'rgba(255,255,255,0.95)';
                nextModelButton.style.transform = 'scale(1)';
                nextModelButton.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            });
            
            // 上一个模型按钮点击事件
            prevModelButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (allModels.length > 1) {
                    switchToModel(currentModelIndex - 1);
                }
            });
            
            // 下一个模型按钮点击事件
            nextModelButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (allModels.length > 1) {
                    switchToModel(currentModelIndex + 1);
                }
            });
            
            // 设置按钮初始状态
            async function initModelButtons() {
                if (allModels.length <= 1) {
                    // 如果只有一个或没有模型，禁用按钮
                    prevModelButton.style.opacity = '0.5';
                    prevModelButton.style.cursor = 'not-allowed';
                    prevModelButton.title = 'No other models available';
                    
                    nextModelButton.style.opacity = '0.5';
                    nextModelButton.style.cursor = 'not-allowed';
                    nextModelButton.title = 'No other models available';
                } else {
                    // 设置初始工具提示
                    const prevModel = getPrevModelInfo();
                    const nextModel = getNextModelInfo();
                    
                    prevModelButton.title = prevModel ? `Previous: ${prevModel.name}` : 'Previous Model';
                    nextModelButton.title = nextModel ? `Next: ${nextModel.name}` : 'Next Model';
                }
                
                console.log(`Model buttons initialized. Current: ${getCurrentModelInfo()?.name || 'Unknown'} (${currentModelIndex + 1}/${allModels.length})`);
            }
            
            initModelButtons();
            
            // 添加到控制面板
            const wsStatusButton = controlPanel.querySelector('#ws-status-handle');
            const dragButton = controlPanel.querySelector('#drag-handle');
            
            if (wsStatusButton) {
                controlPanel.insertBefore(nextModelButton, wsStatusButton.nextSibling);
                controlPanel.insertBefore(prevModelButton, nextModelButton);
            } else if (dragButton) {
                controlPanel.insertBefore(nextModelButton, dragButton.nextSibling);
                controlPanel.insertBefore(prevModelButton, nextModelButton);
            } else {
                controlPanel.appendChild(prevModelButton);
                controlPanel.appendChild(nextModelButton);
            }
            
            console.log(`Model switching buttons added. Available models: ${allModels.length}`);
        }
    }, 1300);
}

animate();