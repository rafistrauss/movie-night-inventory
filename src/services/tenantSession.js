// A generation distinguishes logout/login even when the UID is unchanged.
export class TenantSession {
  constructor(currentUid = () => this.uid) {
    this.currentUid = currentUid;
    this.uid = null;
    this.generation = 0;
  }

  activate(uid) {
    this.uid = uid;
    this.generation++;
  }

  capture() {
    const uid = this.uid;
    const generation = this.generation;
    const isActive = () => Boolean(uid && this.uid === uid && this.generation === generation && this.currentUid() === uid);
    const assertActive = () => {
      if (!isActive()) {
        throw new Error('Authentication session changed. Please retry.');
      }
    };
    assertActive();
    return {
      uid,
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
