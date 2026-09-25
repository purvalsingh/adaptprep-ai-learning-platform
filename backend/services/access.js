const { getStore } = require('../db/store');
const { forbidden, notFound } = require('../lib/http');

const teacherHasStudent = (teacherId, studentId) =>
    getStore().all('classes').some((c) => c.teacherId === teacherId && c.studentIds.includes(studentId));

// Owner, admin, or a teacher of one of the student's classes may view a student's data.
const assertCanViewStudent = (viewer, studentId) => {
    if (viewer.id === studentId || viewer.role === 'admin') return;
    if (viewer.role === 'teacher' && teacherHasStudent(viewer.id, studentId)) return;
    throw forbidden('You can only view students in your own classes.');
};

const loadClass = (id) => {
    const klass = getStore().byId('classes', id);
    if (!klass) throw notFound('Class not found.');
    return klass;
};

const assertClassOwner = (user, klass) => {
    if (user.role === 'admin' || klass.teacherId === user.id) return;
    throw forbidden('Only the class teacher can do that.');
};

const assertClassMember = (user, klass) => {
    if (user.role === 'admin' || klass.teacherId === user.id || klass.studentIds.includes(user.id)) return;
    throw forbidden('You are not a member of this class.');
};

module.exports = { teacherHasStudent, assertCanViewStudent, loadClass, assertClassOwner, assertClassMember };
