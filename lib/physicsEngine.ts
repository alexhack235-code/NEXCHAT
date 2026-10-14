import * as THREE from 'three';

// ============================================================
// 3D NEWTONIAN RIGID BODY & COLLIDER PHYSICS ENGINE
// ============================================================

export type ColliderType = 'box' | 'sphere' | 'capsule';

export interface RaycastHit {
  point: THREE.Vector3;
  normal: THREE.Vector3;
  distance: number;
  collider: Collider;
}

export abstract class Collider {
  abstract type: ColliderType;
  public center: THREE.Vector3 = new THREE.Vector3();
  public isTrigger: boolean = false;
  public tag: string = 'default';
  public enabled: boolean = true;
  public rigidBody: RigidBody | null = null;

  abstract getAABB(): THREE.Box3;
  abstract checkCollision(other: Collider): CollisionResult | null;
  abstract raycast(ray: THREE.Ray, maxDist: number): RaycastHit | null;
}

export interface CollisionResult {
  colliderA: Collider;
  colliderB: Collider;
  normal: THREE.Vector3; // Direction to push colliderA out of colliderB
  penetration: number;   // Overlap distance
  contactPoint: THREE.Vector3;
}

// ------------------------------------------------------------
// Box Collider (Oriented or Axis-Aligned Bounding Box)
// ------------------------------------------------------------
export class BoxCollider extends Collider {
  public type: ColliderType = 'box';
  public halfExtents: THREE.Vector3;

  constructor(center: THREE.Vector3, size: THREE.Vector3, tag: string = 'obstacle') {
    super();
    this.center.copy(center);
    this.halfExtents = size.clone().multiplyScalar(0.5);
    this.tag = tag;
  }

  getAABB(): THREE.Box3 {
    return new THREE.Box3(
      this.center.clone().sub(this.halfExtents),
      this.center.clone().add(this.halfExtents)
    );
  }

  checkCollision(other: Collider): CollisionResult | null {
    if (!this.enabled || !other.enabled) return null;

    if (other instanceof BoxCollider) {
      return this.checkAABBCollision(other);
    } else if (other instanceof CapsuleCollider) {
      const res = other.checkCollisionWithBox(this);
      if (res) {
        // Reverse normal so it pushes this collider away
        res.normal.negate();
        const tmp = res.colliderA;
        res.colliderA = res.colliderB;
        res.colliderB = tmp;
      }
      return res;
    } else if (other instanceof SphereCollider) {
      return this.checkSphereCollision(other);
    }
    return null;
  }

  private checkAABBCollision(other: BoxCollider): CollisionResult | null {
    const boxA = this.getAABB();
    const boxB = other.getAABB();

    if (!boxA.intersectsBox(boxB)) return null;

    // Overlap on each axis
    const overlapX = Math.min(boxA.max.x, boxB.max.x) - Math.max(boxA.min.x, boxB.min.x);
    const overlapY = Math.min(boxA.max.y, boxB.max.y) - Math.max(boxA.min.y, boxB.min.y);
    const overlapZ = Math.min(boxA.max.z, boxB.max.z) - Math.max(boxA.min.z, boxB.min.z);

    if (overlapX <= 0 || overlapY <= 0 || overlapZ <= 0) return null;

    const normal = new THREE.Vector3();
    let penetration = overlapX;
    normal.set(this.center.x < other.center.x ? -1 : 1, 0, 0);

    if (overlapY < penetration) {
      penetration = overlapY;
      normal.set(0, this.center.y < other.center.y ? -1 : 1, 0);
    }
    if (overlapZ < penetration) {
      penetration = overlapZ;
      normal.set(0, 0, this.center.z < other.center.z ? -1 : 1);
    }

    const contactPoint = new THREE.Vector3(
      (Math.max(boxA.min.x, boxB.min.x) + Math.min(boxA.max.x, boxB.max.x)) * 0.5,
      (Math.max(boxA.min.y, boxB.min.y) + Math.min(boxA.max.y, boxB.max.y)) * 0.5,
      (Math.max(boxA.min.z, boxB.min.z) + Math.min(boxA.max.z, boxB.max.z)) * 0.5
    );

    return {
      colliderA: this,
      colliderB: other,
      normal,
      penetration,
      contactPoint,
    };
  }

  private checkSphereCollision(sphere: SphereCollider): CollisionResult | null {
    const box = this.getAABB();
    // Clamped point on box closest to sphere center
    const closest = new THREE.Vector3(
      THREE.MathUtils.clamp(sphere.center.x, box.min.x, box.max.x),
      THREE.MathUtils.clamp(sphere.center.y, box.min.y, box.max.y),
      THREE.MathUtils.clamp(sphere.center.z, box.min.z, box.max.z)
    );

    const diff = closest.clone().sub(sphere.center);
    const distSq = diff.lengthSq();

    if (distSq > sphere.radius * sphere.radius) return null;

    const dist = Math.sqrt(distSq);
    const normal = dist > 0.0001 ? diff.clone().divideScalar(dist) : new THREE.Vector3(0, 1, 0);
    const penetration = sphere.radius - dist;

    return {
      colliderA: this,
      colliderB: sphere,
      normal: normal.negate(),
      penetration,
      contactPoint: closest,
    };
  }

  raycast(ray: THREE.Ray, maxDist: number): RaycastHit | null {
    const box = this.getAABB();
    const hitPoint = new THREE.Vector3();
    const hit = ray.intersectBox(box, hitPoint);
    if (!hit) return null;

    const distance = ray.origin.distanceTo(hitPoint);
    if (distance > maxDist) return null;

    // Estimate normal based on which face was struck
    const normal = new THREE.Vector3();
    const eps = 0.001;
    if (Math.abs(hitPoint.x - box.min.x) < eps) normal.set(-1, 0, 0);
    else if (Math.abs(hitPoint.x - box.max.x) < eps) normal.set(1, 0, 0);
    else if (Math.abs(hitPoint.y - box.min.y) < eps) normal.set(0, -1, 0);
    else if (Math.abs(hitPoint.y - box.max.y) < eps) normal.set(0, 1, 0);
    else if (Math.abs(hitPoint.z - box.min.z) < eps) normal.set(0, 0, -1);
    else if (Math.abs(hitPoint.z - box.max.z) < eps) normal.set(0, 0, 1);

    return {
      point: hitPoint,
      normal,
      distance,
      collider: this,
    };
  }
}

// ------------------------------------------------------------
// Sphere Collider
// ------------------------------------------------------------
export class SphereCollider extends Collider {
  public type: ColliderType = 'sphere';
  public radius: number;

  constructor(center: THREE.Vector3, radius: number, tag: string = 'default') {
    super();
    this.center.copy(center);
    this.radius = radius;
    this.tag = tag;
  }

  getAABB(): THREE.Box3 {
    const ext = new THREE.Vector3(this.radius, this.radius, this.radius);
    return new THREE.Box3(this.center.clone().sub(ext), this.center.clone().add(ext));
  }

  checkCollision(other: Collider): CollisionResult | null {
    if (!this.enabled || !other.enabled) return null;

    if (other instanceof SphereCollider) {
      const diff = this.center.clone().sub(other.center);
      const dist = diff.length();
      const combinedRadius = this.radius + other.radius;

      if (dist >= combinedRadius) return null;

      const normal = dist > 0.0001 ? diff.clone().divideScalar(dist) : new THREE.Vector3(0, 1, 0);
      return {
        colliderA: this,
        colliderB: other,
        normal,
        penetration: combinedRadius - dist,
        contactPoint: this.center.clone().sub(normal.clone().multiplyScalar(this.radius)),
      };
    } else if (other instanceof BoxCollider) {
      const res = other.checkCollision(this);
      if (res) {
        res.normal.negate();
        const tmp = res.colliderA;
        res.colliderA = res.colliderB;
        res.colliderB = tmp;
      }
      return res;
    }
    return null;
  }

  raycast(ray: THREE.Ray, maxDist: number): RaycastHit | null {
    const hitPoint = new THREE.Vector3();
    const sphere = new THREE.Sphere(this.center, this.radius);
    const hit = ray.intersectSphere(sphere, hitPoint);
    if (!hit) return null;

    const distance = ray.origin.distanceTo(hitPoint);
    if (distance > maxDist) return null;

    const normal = hitPoint.clone().sub(this.center).normalize();
    return {
      point: hitPoint,
      normal,
      distance,
      collider: this,
    };
  }
}

// ------------------------------------------------------------
// Capsule Collider (Player & Humanoid Character Model)
// ------------------------------------------------------------
export class CapsuleCollider extends Collider {
  public type: ColliderType = 'capsule';
  public radius: number;
  public height: number; // Total height including hemisphere caps

  constructor(center: THREE.Vector3, radius: number, height: number, tag: string = 'player') {
    super();
    this.center.copy(center);
    this.radius = radius;
    this.height = Math.max(height, radius * 2);
    this.tag = tag;
  }

  get segmentHalfHeight(): number {
    return Math.max(0, (this.height - this.radius * 2) * 0.5);
  }

  get bottomSphereCenter(): THREE.Vector3 {
    return new THREE.Vector3(this.center.x, this.center.y - this.segmentHalfHeight, this.center.z);
  }

  get topSphereCenter(): THREE.Vector3 {
    return new THREE.Vector3(this.center.x, this.center.y + this.segmentHalfHeight, this.center.z);
  }

  getAABB(): THREE.Box3 {
    const halfY = this.height * 0.5;
    return new THREE.Box3(
      new THREE.Vector3(this.center.x - this.radius, this.center.y - halfY, this.center.z - this.radius),
      new THREE.Vector3(this.center.x + this.radius, this.center.y + halfY, this.center.z + this.radius)
    );
  }

  checkCollision(other: Collider): CollisionResult | null {
    if (!this.enabled || !other.enabled) return null;

    if (other instanceof BoxCollider) {
      return this.checkCollisionWithBox(other);
    }
    return null;
  }

  public checkCollisionWithBox(box: BoxCollider): CollisionResult | null {
    const aabb = box.getAABB();

    // Find the point on the capsule vertical line segment closest to the box center
    const clampedY = THREE.MathUtils.clamp(
      box.center.y,
      this.center.y - this.segmentHalfHeight,
      this.center.y + this.segmentHalfHeight
    );
    const capsuleSegmentPoint = new THREE.Vector3(this.center.x, clampedY, this.center.z);

    // Find closest point on box to this capsule segment point
    const closestBoxPoint = new THREE.Vector3(
      THREE.MathUtils.clamp(capsuleSegmentPoint.x, aabb.min.x, aabb.max.x),
      THREE.MathUtils.clamp(capsuleSegmentPoint.y, aabb.min.y, aabb.max.y),
      THREE.MathUtils.clamp(capsuleSegmentPoint.z, aabb.min.z, aabb.max.z)
    );

    const diff = capsuleSegmentPoint.clone().sub(closestBoxPoint);
    const distSq = diff.lengthSq();

    // Check if the distance is less than the capsule radius
    if (distSq >= this.radius * this.radius) return null;

    const dist = Math.sqrt(distSq);
    let normal: THREE.Vector3;
    let penetration: number;

    if (dist > 0.0001) {
      normal = diff.clone().divideScalar(dist);
      penetration = this.radius - dist;
    } else {
      // Deep penetration inside box: choose axis of minimal separation
      normal = new THREE.Vector3(0, 1, 0);
      penetration = this.radius;
    }

    return {
      colliderA: this,
      colliderB: box,
      normal,
      penetration,
      contactPoint: closestBoxPoint,
    };
  }

  raycast(ray: THREE.Ray, maxDist: number): RaycastHit | null {
    // Quick approximation: raycast AABB bounds
    const box = this.getAABB();
    const hitPoint = new THREE.Vector3();
    const hit = ray.intersectBox(box, hitPoint);
    if (!hit) return null;

    const distance = ray.origin.distanceTo(hitPoint);
    if (distance > maxDist) return null;

    return {
      point: hitPoint,
      normal: hitPoint.clone().sub(this.center).normalize(),
      distance,
      collider: this,
    };
  }
}

// ============================================================
// RIGID BODY (NEWTONIAN DYNAMICS: MASS, FORCES, MOMENTUM)
// ============================================================

export class RigidBody {
  public position: THREE.Vector3 = new THREE.Vector3();
  public velocity: THREE.Vector3 = new THREE.Vector3();
  public angularVelocity: THREE.Vector3 = new THREE.Vector3();
  public forces: THREE.Vector3 = new THREE.Vector3();

  public mass: number = 1.0;
  public invMass: number = 1.0;
  public drag: number = 0.05;         // Linear damping
  public friction: number = 0.6;     // Surface Coulomb friction
  public restitution: number = 0.1;  // Coefficient of restitution (bounciness)
  public useGravity: boolean = true;
  public isGrounded: boolean = false;
  public isKinematic: boolean = false; // Kinematic bodies are driven by script

  public collider: Collider | null = null;

  constructor(mass: number = 1.0, isKinematic: boolean = false) {
    this.setMass(mass);
    this.isKinematic = isKinematic;
  }

  public setMass(m: number) {
    this.mass = m;
    this.invMass = m > 0 ? 1.0 / m : 0.0;
  }

  public addForce(force: THREE.Vector3, mode: 'force' | 'impulse' = 'force') {
    if (this.isKinematic || this.invMass === 0) return;
    if (mode === 'impulse') {
      this.velocity.add(force.clone().multiplyScalar(this.invMass));
    } else {
      this.forces.add(force);
    }
  }

  public integrate(dt: number, gravity: THREE.Vector3) {
    if (this.isKinematic || this.invMass === 0) return;

    // Apply gravity
    if (this.useGravity) {
      this.velocity.add(gravity.clone().multiplyScalar(dt));
    }

    // Apply accumulated forces
    const acceleration = this.forces.clone().multiplyScalar(this.invMass);
    this.velocity.add(acceleration.multiplyScalar(dt));

    // Linear drag
    const speed = this.velocity.length();
    if (speed > 0.0001) {
      const dragFactor = Math.max(0, 1 - this.drag * dt);
      this.velocity.multiplyScalar(dragFactor);
    }

    // Update position
    this.position.add(this.velocity.clone().multiplyScalar(dt));

    // Sync collider center
    if (this.collider) {
      this.collider.center.copy(this.position);
    }

    // Clear forces
    this.forces.set(0, 0, 0);
  }
}

// ============================================================
// PHYSICS WORLD (SIMULATION PIPELINE & SPATIAL QUERIES)
// ============================================================

export class PhysicsWorld {
  public gravity: THREE.Vector3 = new THREE.Vector3(0, -18.0, 0);
  public staticColliders: BoxCollider[] = [];
  public dynamicBodies: RigidBody[] = [];
  public groundPlaneY: number = 0;

  public addStaticCollider(collider: BoxCollider) {
    this.staticColliders.push(collider);
  }

  public addDynamicBody(body: RigidBody) {
    this.dynamicBodies.push(body);
  }

  public removeDynamicBody(body: RigidBody) {
    const idx = this.dynamicBodies.indexOf(body);
    if (idx !== -1) this.dynamicBodies.splice(idx, 1);
  }

  // Raycast down or in direction against ground and all static colliders
  public raycast(origin: THREE.Vector3, direction: THREE.Vector3, maxDist: number = 100): RaycastHit | null {
    const ray = new THREE.Ray(origin, direction.clone().normalize());
    let closestHit: RaycastHit | null = null;

    // Check Ground Plane
    if (direction.y < -0.001) {
      const distToGround = (origin.y - this.groundPlaneY) / -direction.y;
      if (distToGround >= 0 && distToGround <= maxDist) {
        closestHit = {
          point: origin.clone().add(direction.clone().multiplyScalar(distToGround)),
          normal: new THREE.Vector3(0, 1, 0),
          distance: distToGround,
          collider: new BoxCollider(new THREE.Vector3(0, this.groundPlaneY - 1, 0), new THREE.Vector3(1000, 2, 1000), 'ground'),
        };
      }
    }

    // Check all static colliders
    for (const col of this.staticColliders) {
      const hit = col.raycast(ray, closestHit ? closestHit.distance : maxDist);
      if (hit && (!closestHit || hit.distance < closestHit.distance)) {
        closestHit = hit;
      }
    }

    return closestHit;
  }

  // Step simulation forward
  public step(dt: number) {
    // 1. Integrate dynamic bodies
    for (const body of this.dynamicBodies) {
      body.integrate(dt, this.gravity);

      // Check ground collision
      const bottomY = body.collider instanceof CapsuleCollider
        ? body.position.y - body.collider.height * 0.5
        : body.position.y;

      if (bottomY <= this.groundPlaneY) {
        const penetration = this.groundPlaneY - bottomY;
        body.position.y += penetration;
        if (body.velocity.y < 0) {
          body.velocity.y = 0;
        }
        body.isGrounded = true;
        if (body.collider) body.collider.center.copy(body.position);
      } else {
        body.isGrounded = false;
      }
    }

    // 2. Collision detection & impulse resolution against static colliders
    for (const body of this.dynamicBodies) {
      if (!body.collider) continue;

      for (const staticCol of this.staticColliders) {
        const result = body.collider.checkCollision(staticCol);
        if (result && result.penetration > 0.001) {
          // Positional Baumgarte correction: push body out along collision normal
          const correction = result.normal.clone().multiplyScalar(result.penetration * 1.02);
          body.position.add(correction);
          if (body.collider) body.collider.center.copy(body.position);

          // Velocity resolution: eliminate velocity component towards the obstacle
          const velDotNormal = body.velocity.dot(result.normal);
          if (velDotNormal < 0) {
            // Remove inward velocity, apply friction along tangent
            const normalVelocity = result.normal.clone().multiplyScalar(velDotNormal);
            const tangentVelocity = body.velocity.clone().sub(normalVelocity);

            // Friction slows lateral sliding slightly
            tangentVelocity.multiplyScalar(Math.max(0, 1 - body.friction * 0.15));

            // Restitution bounce
            body.velocity.copy(tangentVelocity).sub(normalVelocity.multiplyScalar(body.restitution));
          }

          // If hit top surface, mark as grounded
          if (result.normal.y > 0.6) {
            body.isGrounded = true;
          }
        }
      }
    }
  }
}

export const physicsWorld = new PhysicsWorld();
