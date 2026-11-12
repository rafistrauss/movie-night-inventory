// A generation distinguishes account changes and tenant switches.
export class TenantSession {
  constructor(currentUid = () => this.uid) {
    this.currentUid = currentUid;
    this.uid = null;
    this.tenantId = null;
    this.generation = 0;
  }

  activate(uid, tenantId = uid) {
    this.uid = uid;
    this.tenantId = tenantId;
    this.generation++;
  }

  capture() {
    const uid = this.uid;
    const tenantId = this.tenantId;
    const generation = this.generation;
    const isActive = () => Boolean(uid && tenantId && this.uid === uid && this.tenantId === tenantId && this.generation === generation && this.currentUid() === uid);
    const assertActive = () => {
      if (!isActive()) {
        throw new Error('Authentication session changed. Please retry.');
      }
    };
    assertActive();
    return {
      uid,
      tenantId,
      assertActive,
      isActive,
      // A thunk prevents stale views from even starting a new-account operation.
      async wait(operation) {
        assertActive();
        const result = await operation();
        assertActive();
        return result;
      }
    };
  }
}
