const { getStore } = require('../db/store');

// Removes a user and everything that belongs only to them.
const deleteUserCascade = (userId) => {
    const store = getStore();
    const user = store.byId('users', userId);
    if (!user) return false;

    store.removeWhere('attempts', (a) => a.userId === userId);
    store.removeWhere('chats', (c) => c.userId === userId);
    store.all('classes').forEach((c) => {
        if (c.studentIds.includes(userId)) c.studentIds = c.studentIds.filter((id) => id !== userId);
    });

    // A teacher's classes (and their assignments/announcements) go with them.
    const owned = store.find('classes', (c) => c.teacherId === userId).map((c) => c.id);
    if (owned.length) {
        const assignmentIds = store.find('assignments', (a) => owned.includes(a.classId)).map((a) => a.id);
        store.removeWhere('assignments', (a) => owned.includes(a.classId));
        store.removeWhere('announcements', (a) => owned.includes(a.classId));
        store.all('attempts').forEach((a) => {
            if (assignmentIds.includes(a.assignmentId)) a.classId = null;
        });
        store.removeWhere('classes', (c) => owned.includes(c.id));
    }
    store.removeWhere('announcements', (a) => a.authorId === userId);
    store.remove('users', userId);
    store.save();
    return true;
};

const userCard = (u) => (u ? { id: u.id, name: u.name, avatar: u.avatar, role: u.role, email: u.email } : null);

module.exports = { deleteUserCascade, userCard };
