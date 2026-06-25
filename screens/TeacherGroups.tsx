import { useState, useEffect } from 'react';
import { useNavigate } from '@/utils/routing-adapter';
import { useAuth } from '../contexts/AuthContext';

interface Student {
  id: number;
  group_id: number;
  student_name: string;
  created_at: string;
  login?: string;
  password_hash?: string;
  plain_password?: string;
  is_active?: boolean;
  points?: number;
}

interface NewStudent {
  name: string;
  login: string;
  password: string;
}

interface Group {
  id: number;
  name: string;
  teacher_id: number;
  created_at: string;
  updated_at: string;
  students: Student[];
}

export default function TeacherGroups() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [students, setStudents] = useState<NewStudent[]>([{ name: '', login: '', password: '' }]);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showCredentials, setShowCredentials] = useState<number | null>(null);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [selectedGroupForAddStudent, setSelectedGroupForAddStudent] = useState<number | null>(null);

  useEffect(() => {
    if (authLoading) return;
    setGroups([]);
    fetchGroups();
  }, [user?.id, authLoading]);

  const fetchGroups = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/kids-api/groups?teacherId=${user.id}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch groups');
      }

      // Ensure each group has a students array (handle null/undefined)
      const groupsWithStudents = (data.data || []).map((group: Group) => ({
        ...group,
        students: group.students || []
      }));

      setGroups(groupsWithStudents);
    } catch (err) {
      console.error('Error fetching groups:', err);
      setError(err instanceof Error ? err.message : 'Failed to load groups');
    } finally {
      setIsLoading(false);
    }
  };

  // Remove student from group
  const handleRemoveStudentFromGroup = async (groupId: number, studentId: number, studentName: string) => {
    if (!confirm(`Удалить "${studentName}" из группы?`)) {
      return;
    }

    try {
      const response = await fetch(`/kids-api/groups/${groupId}/students/${studentId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to remove student');
      }

      alert('Ученик удален из группы');
      fetchGroups(); // Refresh groups list
    } catch (err) {
      console.error('Error removing student from group:', err);
      alert('Ошибка при удалении ученика из группы');
    }
  };

  // Open add student modal
  const openAddStudentModal = (groupId: number) => {
    setSelectedGroupForAddStudent(groupId);
    setShowAddStudentModal(true);
    setStudents([{ name: '', login: '', password: '' }]);
  };

  // Create and add students to group
  const handleCreateAndAddStudents = async (groupId: number) => {
    try {
      // Validate all students
      for (const student of students) {
        if (!student.name.trim() || !student.login.trim()) {
          alert('Пожалуйста, заполните имя и логин для каждого ученика');
          return;
        }
      }

      // Create students (they're automatically added to the group by the backend)
      for (const student of students) {
        try {
          const createResponse = await fetch('/kids-api/students', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              groupId: groupId,
              studentName: student.name,
              login: student.login,
              password: student.password,
            }),
          });

          const createData = await createResponse.json();

          if (!createData.success) {
            throw new Error(createData.error || 'Failed to create student');
          }
        } catch (err) {
          console.error('Error creating student:', err);
          alert(`Ошибка при создании ученика "${student.name}": ${err instanceof Error ? err.message : 'Unknown error'}`);
          return; // Stop on first error
        }
      }

      alert('Ученики успешно созданы и добавлены в группу!');
      setShowAddStudentModal(false);
      setStudents([{ name: '', login: '', password: '' }]);
      fetchGroups(); // Refresh groups list
    } catch (err) {
      console.error('Error creating students:', err);
      alert('Ошибка при создании учеников');
    }
  };

  const addStudentField = () => {
    setStudents([...students, { name: '', login: '', password: '' }]);
  };

  const updateStudent = (index: number, field: keyof NewStudent, value: string) => {
    const newStudents = [...students];
    newStudents[index][field] = value;
    setStudents(newStudents);
  };

  const removeStudent = (index: number) => {
    setStudents(students.filter((_, i) => i !== index));
  };

  const handleCreateGroup = async () => {
    const validStudents = students.filter(s => s.name.trim() !== '' && s.login.trim() !== '');

    if (validStudents.length === 0) {
      alert('Добавьте хотя бы одного ученика с логином и паролем!');
      return;
    }

    try {
      // First create the group without students
      const response = await fetch('/kids-api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: groupName,
          teacherId: user?.id,
          students: [], // Empty array, we'll add students separately
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to create group');
      }

      const newGroupId = data.data.id;

      // Now add each student with login/password
      let successCount = 0;
      let errors: string[] = [];

      for (const student of validStudents) {
        try {
          const studentResponse = await fetch('/kids-api/students', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              groupId: newGroupId,
              studentName: student.name,
              login: student.login,
              password: student.password,
            }),
          });

          const studentData = await studentResponse.json();

          if (studentData.success) {
            successCount++;
          } else {
            errors.push(`${student.name}: ${studentData.error}`);
          }
        } catch (err) {
          errors.push(`${student.name}: Ошибка сети`);
        }
      }

      if (errors.length > 0) {
        alert(`Группа "${groupName}" создана!\n\n✅ Добавлено учеников: ${successCount}\n❌ Ошибки: ${errors.length}\n\n${errors.join('\n')}`);
      } else {
        alert(`Группа "${groupName}" успешно создана с ${successCount} учениками!`);
      }

      setShowCreateForm(false);
      setShowGroupModal(false);
      setGroupName('');
      setStudents([{ name: '', login: '', password: '' }]);

      // Refresh groups list
      fetchGroups();
    } catch (error) {
      console.error('Error creating group:', error);
      alert('Ошибка при создании группы: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleEditGroup = (group: Group) => {
    setEditingGroup(group);
    setGroupName(group.name);
    // Convert existing students to editable format
    const editableStudents = group.students.map(s => ({
      id: s.id,
      name: s.student_name,
      login: s.login || '',
      password: s.plain_password || ''
    }));
    setStudents(editableStudents as any);
    setShowEditForm(true);
  };

  const handleUpdateGroup = async () => {
    if (!editingGroup) return;

    try {
      // Update each student's login and password
      for (const student of students) {
        const studentData: any = {
          login: student.login.trim(),
        };

        // Only send password if it's not empty (user wants to change it)
        if (student.password && student.password.trim() !== '') {
          studentData.password = student.password.trim();
        }

        const response = await fetch(`/kids-api/students/${(student as any).id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(studentData),
        });

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || `Failed to update student ${student.name}`);
        }
      }

      alert('Группа успешно обновлена!');
      setShowEditForm(false);
      setEditingGroup(null);
      setGroupName('');
      setStudents([{ name: '', login: '', password: '' }]);

      // Refresh groups list
      fetchGroups();
    } catch (error) {
      console.error('Error updating group:', error);
      alert('Ошибка при обновлении группы: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleDeleteGroup = async (groupId: number, groupName: string) => {
    if (!confirm(`Вы уверены, что хотите удалить группу "${groupName}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/kids-api/groups/${groupId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to delete group');
      }

      // Refresh groups list
      fetchGroups();
    } catch (err) {
      console.error('Error deleting group:', err);
      alert('Ошибка при удалении группы');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // Optional: show a brief success message
    });
  };

  const copyAllCredentials = (group: Group) => {
    const credentials = group.students
      .map((s, i) => `${i + 1}. ${s.student_name}\n   Логин: ${s.login || 'не установлен'}\n   Пароль: ${s.plain_password || 'не установлен'}`)
      .join('\n\n');

    const fullText = `Учетные данные для группы "${group.name}"\n\n${credentials}`;
    copyToClipboard(fullText);
    alert('Учетные данные скопированы в буфер обмена!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/teacher/dashboard')}
                className="text-gray-600 hover:text-gray-800 transition"
              >
                ← Назад
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Мои группы</h1>
                {user?.displayName && (
                  <p className="text-sm text-gray-500 mt-0.5">{user.displayName}</p>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/map')}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition"
              >
                🗺️ Вернуться на карту
              </button>
              <button
                onClick={() => setShowGroupModal(true)}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition"
              >
                + Создать группу
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="text-2xl">⏳</div>
            <p className="text-gray-600 mt-4">Загрузка групп...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
            {error}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && groups.length === 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="text-6xl mb-4">👥</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              У вас пока нет групп
            </h2>
            <p className="text-gray-600 mb-6">
              Создайте свою первую группу студентов
            </p>
            <button
              onClick={() => setShowGroupModal(true)}
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg transition"
            >
              + Создать группу
            </button>
          </div>
        )}

        {/* Groups List */}
        {!isLoading && !error && groups.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group) => (
              <div
                key={group.id}
                className="bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-1">
                      {group.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {group.students.length}{' '}
                      {group.students.length === 1
                        ? 'ученик'
                        : group.students.length < 5
                        ? 'ученика'
                        : 'учеников'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowCredentials(showCredentials === group.id ? null : group.id)}
                      className="text-green-500 hover:text-green-700 transition p-2"
                      title={showCredentials === group.id ? "Скрыть учетные данные" : "Показать учетные данные"}
                    >
                      {showCredentials === group.id ? '🔒' : '👁️'}
                    </button>
                    <button
                      onClick={() => {
                        const url = `${window.location.origin}/join/${group.id}`;
                        navigator.clipboard.writeText(url);
                        alert(`Ссылка скопирована:\n${url}`);
                      }}
                      className="text-green-500 hover:text-green-700 transition p-2"
                      title="Ссылка для входа учеников"
                    >
                      🔗
                    </button>
                    <button
                      onClick={() => copyAllCredentials(group)}
                      className="text-purple-500 hover:text-purple-700 transition p-2"
                      title="Скопировать все учетные данные"
                    >
                      📋
                    </button>
                    <button
                      onClick={() => handleEditGroup(group)}
                      className="text-blue-500 hover:text-blue-700 transition p-2"
                      title="Редактировать группу"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDeleteGroup(group.id, group.name)}
                      className="text-red-500 hover:text-red-700 transition p-2"
                      title="Удалить группу"
                    >
                      🗑️
                    </button>
                    <button
                      onClick={() => openAddStudentModal(group.id)}
                      className="text-green-500 hover:text-green-700 transition p-2"
                      title="Добавить ученика"
                    >
                      ➕
                    </button>
                  </div>
                </div>

                {/* Students List */}
                <div className="border-t border-gray-200 pt-4">
                  {group.students.length === 0 ? (
                    <p className="text-gray-400 text-sm">Нет учеников</p>
                  ) : (
                    <ul className="space-y-3">
                      {group.students.map((student) => (
                        <li
                          key={student.id}
                          className="bg-gray-50 rounded-lg p-3"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 text-gray-800 font-medium mb-1">
                                <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                                {student.student_name}
                                <button
                                  onClick={() => handleRemoveStudentFromGroup(group.id, student.id, student.student_name)}
                                  className="text-red-400 hover:text-red-600 text-xs ml-auto"
                                  title="Удалить из группы"
                                >
                                  ✕
                                </button>
                              </div>
                              {showCredentials === group.id && (
                                <div className="ml-4 space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500">Логин:</span>
                                    <code className="text-xs bg-white px-2 py-1 rounded border border-gray-200 text-indigo-600 font-mono">
                                      {student.login || 'не установлен'}
                                    </code>
                                    {student.login && (
                                      <button
                                        onClick={() => copyToClipboard(student.login || '')}
                                        className="text-xs text-blue-500 hover:text-blue-700"
                                        title="Скопировать логин"
                                      >
                                        📋
                                      </button>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500">Пароль:</span>
                                    <code className="text-xs bg-white px-2 py-1 rounded border border-gray-200 text-indigo-600 font-mono">
                                      {student.plain_password || '••••••••'}
                                    </code>
                                    {student.plain_password ? (
                                      <button
                                        onClick={() => copyToClipboard(student.plain_password || '')}
                                        className="text-xs text-blue-500 hover:text-blue-700"
                                        title="Скопировать пароль"
                                      >
                                        📋
                                      </button>
                                    ) : (
                                      <span className="text-xs text-amber-600" title="Пароль установлен, но скрыт">
                                        🔒 установлен
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Group Date */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-400">
                    Создана: {new Date(group.created_at).toLocaleDateString('ru-RU')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Group Creation Modal */}
      {showGroupModal && !showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
              Добавить группу
            </h2>

            <div className="space-y-4">
              {/* Create New Group Option */}
              <button
                onClick={() => setShowCreateForm(true)}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-semibold py-4 px-6 rounded-xl transition transform hover:scale-105 shadow-lg"
              >
                <div className="flex items-center justify-center gap-3">
                  <span className="text-2xl">➕</span>
                  <div className="text-left">
                    <div className="text-lg">Создать группу</div>
                    <div className="text-sm opacity-90">Создать новую группу с нуля</div>
                  </div>
                </div>
              </button>

              {/* Import from TutorDesk Option */}
              <button
                onClick={() => {
                  setShowGroupModal(false);
                  // TODO: Navigate to import from TutorDesk page
                  alert('Импорт из TutorDesk - в разработке');
                }}
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold py-4 px-6 rounded-xl transition transform hover:scale-105 shadow-lg"
              >
                <div className="flex items-center justify-center gap-3">
                  <span className="text-2xl">📥</span>
                  <div className="text-left">
                    <div className="text-lg">Импортировать из TutorDesk</div>
                    <div className="text-sm opacity-90">Синхронизировать с существующей группой</div>
                  </div>
                </div>
              </button>
            </div>

            {/* Cancel Button */}
            <button
              onClick={() => setShowGroupModal(false)}
              className="w-full mt-6 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-xl transition"
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Create Group Form */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 my-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Создать группу</h2>

            {/* Group Name */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Название группы
              </label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Например: Группа 5А"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none transition"
              />
            </div>

            {/* Students List */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Ученики
              </label>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {students.map((student, index) => (
                  <div key={index} className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-gray-600">Ученик {index + 1}</span>
                      {students.length > 1 && (
                        <button
                          onClick={() => removeStudent(index)}
                          className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-600 rounded text-sm transition"
                        >
                          ✕ Удалить
                        </button>
                      )}
                    </div>
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={student.name}
                        onChange={(e) => updateStudent(index, 'name', e.target.value)}
                        placeholder="Имя ученика"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none transition"
                      />
                      <input
                        type="text"
                        value={student.login}
                        onChange={(e) => updateStudent(index, 'login', e.target.value)}
                        placeholder="Логин (например: maria)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none transition"
                      />
                      <div className="w-full px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                        🔑 PIN будет сгенерирован автоматически
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={addStudentField}
                className="mt-3 w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition"
              >
                + Добавить ученика
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setGroupName('');
                  setStudents([{ name: '', login: '', password: '' }]);
                }}
                className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition"
              >
                Отмена
              </button>
              <button
                onClick={handleCreateGroup}
                disabled={!groupName.trim() || students.filter(s => s.name.trim() && s.login.trim()).length === 0}
                className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Group Form */}
      {showEditForm && editingGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 my-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Редактировать группу: {editingGroup.name}
            </h2>

            {/* Students List */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Ученики - Добавить/Изменить логины и пароли
              </label>


              <div className="space-y-4 max-h-96 overflow-y-auto">
                {students.map((student, index) => (
                  <div key={index} className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-gray-600">
                        {student.name}
                      </span>
                      {student.login && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                          ✓ Логин установлен
                        </span>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div>
                        <input
                          type="text"
                          value={student.login}
                          onChange={(e) => updateStudent(index, 'login', e.target.value)}
                          placeholder="Логин (например: ivan123)"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none transition"
                        />
                        {student.login && (
                          <p className="text-xs text-gray-500 mt-1">Текущий логин: {student.login}</p>
                        )}
                      </div>
                      <div>
                        <input
                          type="text"
                          value={student.password}
                          onChange={(e) => updateStudent(index, 'password', e.target.value)}
                          placeholder="Пароль"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none transition"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowEditForm(false);
                  setEditingGroup(null);
                  setGroupName('');
                  setStudents([{ name: '', login: '', password: '' }]);
                }}
                className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition"
              >
                Отмена
              </button>
              <button
                onClick={handleUpdateGroup}
                className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold rounded-lg transition"
              >
                Сохранить изменения
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Student to Group Modal */}
      {showAddStudentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Создать ученика</h2>
                <button
                  onClick={() => {
                    setShowAddStudentModal(false);
                    setStudents([{ name: '', login: '', password: '' }]);
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                {students.map((student, index) => (
                  <div key={index} className="bg-gradient-to-br from-indigo-50 to-purple-50 p-4 rounded-xl border-2 border-indigo-200">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-indigo-700">Ученик {index + 1}</h3>
                      {students.length > 1 && (
                        <button
                          onClick={() => removeStudent(index)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Имя ученика"
                        value={student.name}
                        onChange={(e) => updateStudent(index, 'name', e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition"
                      />
                      <input
                        type="text"
                        placeholder="Логин"
                        value={student.login}
                        onChange={(e) => updateStudent(index, 'login', e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition"
                      />
                      <div className="w-full px-4 py-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                        🔑 PIN будет сгенерирован автоматически
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  onClick={addStudentField}
                  className="w-full py-2 bg-gradient-to-r from-indigo-100 to-purple-100 hover:from-indigo-200 hover:to-purple-200 text-indigo-700 font-semibold rounded-lg transition flex items-center justify-center gap-2"
                >
                  <span className="text-xl">+</span>
                  Добавить еще ученика
                </button>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowAddStudentModal(false);
                    setStudents([{ name: '', login: '', password: '' }]);
                  }}
                  className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition"
                >
                  Отмена
                </button>
                <button
                  onClick={() => selectedGroupForAddStudent && handleCreateAndAddStudents(selectedGroupForAddStudent)}
                  className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold rounded-lg transition"
                >
                  Создать и добавить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
