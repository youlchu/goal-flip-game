import * as THREE from "three";
import { Scenario } from "../Scenario";
import type { World } from "../World";
import type { IUpdatable } from "../../interfaces/IUpdatable";

import { GoalKeeperSpawnPoint } from "./GoalKeeperSpawnPoint";
import { ShooterSpawnPoint } from "./ShooterSpawnPoint";
import { BallSpawnPoint } from "./BallSpawnPoint";
import type { Shooter } from "../../characters/Shooter";
import type { Goalkeeper } from "../../characters/Goalkeeper";
import type { Ball } from "../../objects/Ball";
export enum PenaltyResult {
  GOAL = "goal",
  SAVE = "save",
}

export enum GoalZone {
  LEFT_DOWN = "left_down",
  LEFT_CENTER = "left_center",
  LEFT_UP = "left_up",
  CENTER_DOWN = "center_down",
  CENTER_CENTER = "center_center",
  CENTER_UP = "center_up",
  RIGHT_DOWN = "right_down",
  RIGHT_CENTER = "right_center",
  RIGHT_UP = "right_up",
}

export class PenaltyScenario extends Scenario implements IUpdatable {
  public updateOrder: number = 1;

  private goalkeeper?: Goalkeeper;
  private shooter?: Shooter;
  private ball?: Ball;

  // Kaleci animasyon mapping (resimden düzeltildi)
  private readonly keeperAnimations = {
    [GoalZone.LEFT_DOWN]: "left_down_catch",
    [GoalZone.LEFT_CENTER]: "left_center_take",
    [GoalZone.LEFT_UP]: "left_top_catch",
    [GoalZone.CENTER_DOWN]: "center_down_take",
    [GoalZone.CENTER_CENTER]: "center_take",
    [GoalZone.CENTER_UP]: "center_top_catch",
    [GoalZone.RIGHT_DOWN]: "right_down_catch",
    [GoalZone.RIGHT_CENTER]: "right_center_take",
    [GoalZone.RIGHT_UP]: "right_top_catch",
  };

  private readonly goalZonePositions = {
    [GoalZone.LEFT_DOWN]: new THREE.Vector3(0.5, -2.5, 0.3),
    [GoalZone.LEFT_CENTER]: new THREE.Vector3(0.5, -2.5, 0.5),
    [GoalZone.LEFT_UP]: new THREE.Vector3(0.5, -2.5, 0.7),
    [GoalZone.CENTER_DOWN]: new THREE.Vector3(0, -2.5, 0.3),
    [GoalZone.CENTER_CENTER]: new THREE.Vector3(0, -2.5, 0.5),
    [GoalZone.CENTER_UP]: new THREE.Vector3(0, -2.5, 0.7),
    [GoalZone.RIGHT_DOWN]: new THREE.Vector3(-0.5, -2.5, 0.3),
    [GoalZone.RIGHT_CENTER]: new THREE.Vector3(-0.5, -2.5, 0.5),
    [GoalZone.RIGHT_UP]: new THREE.Vector3(-0.5, -2.5, 0.7),
  };

  constructor(root: THREE.Object3D, world: World) {
    super(root, world);

    root.traverse((child) => {
      if (child.userData.data == "spawn") {
        if (child.userData.type == "goalkeeper") {
          const goalkeeper = new GoalKeeperSpawnPoint(child as THREE.Object3D);
          this.spawnPoints.push(goalkeeper);
        } else if (child.userData.type == "shooter") {
          const shooter = new ShooterSpawnPoint(child as THREE.Object3D);
          this.spawnPoints.push(shooter);
        } else if (child.userData.type == "ball") {
          const ball = new BallSpawnPoint(child as THREE.Object3D);
          this.spawnPoints.push(ball);
        }
      }
    });

    if (!this.invisible) this.createLaunchLink();
  }

  protected onAllEntitiesSpawned(): void {
    this.goalkeeper = this.getEntitiesByType<Goalkeeper>("Goalkeeper")[0];
    this.shooter = this.getEntitiesByType<Shooter>("Shooter")[0];
    this.ball = this.getEntitiesByType<Ball>("Ball")[0];

    this.start();
  }

  public start(): void {
    setTimeout(() => {
      const result = this.executePenalty();
      console.log(`Penalty result: ${result}`);
    }, 1000);
  }

  private executePenalty(): PenaltyResult {
    // Rastgele top hedefi seç
    const ballTarget = this.getRandomGoalZone();

    // Rastgele kaleci hareketi seç
    const keeperMove = this.getRandomGoalZone();

    console.log(`Ball target: ${ballTarget}, Keeper move: ${keeperMove}`);

    // Atışı başlat
    this.startShot(ballTarget);

    // Kaleci hareketini başlat
    this.startKeeperMove(keeperMove);

    // Sonucu belirle
    return ballTarget === keeperMove ? PenaltyResult.SAVE : PenaltyResult.GOAL;
  }

  private getRandomGoalZone(): GoalZone {
    const zones = Object.values(GoalZone);
    const randomIndex = Math.floor(Math.random() * zones.length);
    return zones[randomIndex];
  }

  private startShot(targetZone: GoalZone): void {
    if (!this.shooter || !this.ball) return;

    const duration = this.shooter.setAnimation("penalty", 0.1, 1, false, true);

    const targetPos = this.goalZonePositions[targetZone];
    const ballPos = this.ball.position;

    // Yön hesapla
    const direction = new THREE.Vector3(
      targetPos.x - ballPos.x,
      targetPos.y - ballPos.y,
      targetPos.z - ballPos.z
    ).normalize();

    // Çok küçük impuls değerleri (Rapier için optimize)
    const baseForce = 0.2; // Ana kuvvet
    const upwardForce = 0.1; // Yukarı kuvvet

    const force = new THREE.Vector3(
      direction.x * baseForce,
      direction.y * baseForce, // Y ekseninde de hareket
      direction.z * upwardForce // Hafif yükselme
    );

    const randomFactor = Math.random();
    force.multiplyScalar(randomFactor);

    setTimeout(() => {
      this.ball?.applyForce(force);
    }, (duration ?? 0) * 1000 - 950);
  }

  private startKeeperMove(moveZone: GoalZone): void {
    if (!this.goalkeeper) return;

    const animation = this.keeperAnimations[moveZone];
    this.goalkeeper.setAnimation(animation, 0.1, 1, false, true);
  }

  public stop(): void {}

  public update(_delta: number): void {}
}
