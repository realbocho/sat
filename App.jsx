import React, { useState, useEffect, useRef } from 'react';
import { Lock, Plus, MessageSquare, Heart, Image, X } from 'lucide-react';
import { supabase } from './lib/supabase';

export default function SuneungTimeCapsule() {
  const [capsules, setCapsules] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [selectedCapsule, setSelectedCapsule] = useState(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [draggedCapsule, setDraggedCapsule] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });

  const animationFrameRef = useRef(null);

  // 캡슐 생성 폼 상태
  const [newCapsule, setNewCapsule] = useState({
    name: '',
    password: '',
    image: null,
    imagePreview: null,
    currentFeeling: '',
    futureMessage: ''
  });

  // 캡슐 열기 폼 상태
  const [openPassword, setOpenPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // 개봉 가능 시간 (2025년 11월 13일 오후 6시)
  const unlockDate = new Date('2025-11-13T18:00:00');

  // 물리 상수
  const GRAVITY = 0.5;
  const BOUNCE = 0.7;
  const FRICTION = 0.98;
  const CAPSULE_WIDTH = 80; // 모바일용 크기
  const CAPSULE_HEIGHT = 100;

  // 스토리지에서 캡슐 불러오기
  useEffect(() => {
    loadCapsules();
  }, []);

  // 모달이 열릴 때 body 스크롤 방지
  useEffect(() => {
    if (showCreateModal || showOpenModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showCreateModal, showOpenModal]);

  // 물리 엔진
  useEffect(() => {
    const updatePhysics = () => {
      setCapsules(prev => {
        const container = document.getElementById('capsule-container');
        if (!container) return prev;
        
        const rect = container.getBoundingClientRect();
        const containerWidth = rect.width;
        const containerHeight = rect.height;
        
        return prev.map(capsule => {
          // 드래그 중인 캡슐은 물리 법칙 적용 안함
          if (draggedCapsule === capsule.id) {
            return { ...capsule, velocity: { x: 0, y: 0 } };
          }

          let { x, y } = capsule.position;
          let vx = capsule.velocity?.x || 0;
          let vy = capsule.velocity?.y || 0;

          // 중력 적용
          vy += GRAVITY;

          // 마찰력
          vx *= FRICTION;
          vy *= FRICTION;

          // 위치 업데이트
          x += vx / containerWidth * 100;
          y += vy / containerHeight * 100;

          // 바닥 충돌
          const bottomLimit = (containerHeight - CAPSULE_HEIGHT) / containerHeight * 100;
          if (y > bottomLimit) {
            y = bottomLimit;
            vy = -vy * BOUNCE;
            if (Math.abs(vy) < 0.5) vy = 0;
          }

          // 천장 충돌
          if (y < 0) {
            y = 0;
            vy = -vy * BOUNCE;
          }

          // 좌우 벽 충돌
          const rightLimit = (containerWidth - CAPSULE_WIDTH) / containerWidth * 100;
          if (x > rightLimit) {
            x = rightLimit;
            vx = -vx * BOUNCE;
          }
          if (x < 0) {
            x = 0;
            vx = -vx * BOUNCE;
          }

          // 다른 캡슐과의 충돌 감지
          prev.forEach(other => {
            if (other.id !== capsule.id && other.id !== draggedCapsule) {
              const dx = (other.position.x - x) * containerWidth / 100;
              const dy = (other.position.y - y) * containerHeight / 100;
              const distance = Math.sqrt(dx * dx + dy * dy);
              const minDistance = CAPSULE_WIDTH * 0.8;

              if (distance < minDistance && distance > 0) {
                const angle = Math.atan2(dy, dx);
                const targetX = x + Math.cos(angle) * minDistance * 100 / containerWidth;
                const targetY = y + Math.sin(angle) * minDistance * 100 / containerHeight;
                const ax = (targetX - other.position.x) * 0.05;
                const ay = (targetY - other.position.y) * 0.05;
                
                vx -= ax;
                vy -= ay;
              }
            }
          });

          return {
            ...capsule,
            position: { x, y },
            velocity: { x: vx, y: vy }
          };
        });
      });

      animationFrameRef.current = requestAnimationFrame(updatePhysics);
    };

    animationFrameRef.current = requestAnimationFrame(updatePhysics);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [draggedCapsule]);

  // Supabase에서 캡슐 불러오기
  const loadCapsules = async () => {
    // Supabase가 설정되지 않았으면 localStorage 사용
    if (!supabase) {
      loadCapsulesFromLocalStorage();
      return;
    }

    try {
      const { data, error } = await supabase
        .from('capsules')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('캡슐 로드 실패:', error);
        // Supabase 연결 실패 시 localStorage로 폴백
        loadCapsulesFromLocalStorage();
        return;
      }

      if (data && data.length > 0) {
        // Supabase 데이터를 앱 형식으로 변환
        const capsulesWithPosition = data.map(capsule => ({
          id: capsule.id,
          name: capsule.name,
          password: capsule.password,
          image: capsule.image,
          currentFeeling: capsule.current_feeling || capsule.currentFeeling,
          futureMessage: capsule.future_message || capsule.futureMessage,
          createdAt: capsule.created_at || capsule.createdAt,
          position: capsule.position || {
            x: Math.random() * 60 + 20,
            y: 10 + Math.random() * 20
          },
          velocity: capsule.velocity || { x: 0, y: 0 }
        }));
        setCapsules(capsulesWithPosition);
      } else {
        // 데이터가 없으면 localStorage 확인
        loadCapsulesFromLocalStorage();
      }
    } catch (error) {
      console.error('캡슐 로드 실패:', error);
      // 에러 발생 시 localStorage로 폴백
      loadCapsulesFromLocalStorage();
    } finally {
      setLoading(false);
    }
  };

  // localStorage에서 캡슐 불러오기 (폴백)
  const loadCapsulesFromLocalStorage = () => {
    try {
      const storedCapsules = localStorage.getItem('timeCapsules');
      if (storedCapsules) {
        const loadedCapsules = JSON.parse(storedCapsules);
        const capsulesWithPosition = loadedCapsules.map(capsule => {
          if (!capsule.position) {
            capsule.position = {
              x: Math.random() * 60 + 20,
              y: 10 + Math.random() * 20
            };
          }
          capsule.velocity = capsule.velocity || { x: 0, y: 0 };
          return capsule;
        });
        setCapsules(capsulesWithPosition);
      }
    } catch (error) {
      console.error('localStorage 로드 실패:', error);
    }
  };

  // Supabase에 캡슐 저장
  const saveCapsuleToSupabase = async (capsule) => {
    // Supabase가 설정되지 않았으면 localStorage 사용
    if (!supabase) {
      saveCapsuleToLocalStorage(capsule);
      return;
    }

    try {
      const { error } = await supabase
        .from('capsules')
        .upsert({
          id: capsule.id,
          name: capsule.name,
          password: capsule.password,
          image: capsule.image,
          current_feeling: capsule.currentFeeling,
          future_message: capsule.futureMessage,
          position: capsule.position,
          velocity: capsule.velocity,
          created_at: capsule.createdAt || new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        });

      if (error) {
        console.error('캡슐 저장 실패:', error);
        // Supabase 저장 실패 시 localStorage로 폴백
        saveCapsuleToLocalStorage(capsule);
      }
    } catch (error) {
      console.error('캡슐 저장 실패:', error);
      saveCapsuleToLocalStorage(capsule);
    }
  };

  // localStorage에 캡슐 저장 (폴백)
  const saveCapsuleToLocalStorage = (capsule) => {
    try {
      const storedCapsules = localStorage.getItem('timeCapsules');
      const capsules = storedCapsules ? JSON.parse(storedCapsules) : [];
      const index = capsules.findIndex(c => c.id === capsule.id);
      if (index >= 0) {
        capsules[index] = capsule;
      } else {
        capsules.push(capsule);
      }
      localStorage.setItem('timeCapsules', JSON.stringify(capsules));
    } catch (error) {
      console.error('localStorage 저장 실패:', error);
      alert('저장 공간이 부족합니다. 일부 데이터를 삭제해주세요.');
    }
  };

  // 캡슐 위치 업데이트 저장 (디바운싱)
  const saveCapsulePositionRef = useRef(null);
  useEffect(() => {
    if (saveCapsulePositionRef.current) {
      clearTimeout(saveCapsulePositionRef.current);
    }
    
    if (capsules.length > 0 && !loading && draggedCapsule === null) {
      // 드래그가 끝난 후 1초 뒤에 저장 (성능 최적화)
      saveCapsulePositionRef.current = setTimeout(() => {
        const capsulesToSave = [...capsules];
        capsulesToSave.forEach(capsule => {
          saveCapsuleToSupabase(capsule);
        });
      }, 1000);
    }

    return () => {
      if (saveCapsulePositionRef.current) {
        clearTimeout(saveCapsulePositionRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [capsules, loading, draggedCapsule]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // 파일 크기 제한 (5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('이미지 크기는 5MB 이하여야 합니다.');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setNewCapsule({
          ...newCapsule,
          image: reader.result,
          imagePreview: reader.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateCapsule = async () => {
    if (!newCapsule.name || !newCapsule.password) {
      alert('이름과 비밀번호를 입력해주세요!');
      return;
    }

    const capsule = {
      id: Date.now(),
      name: newCapsule.name,
      password: newCapsule.password,
      image: newCapsule.image,
      currentFeeling: newCapsule.currentFeeling,
      futureMessage: newCapsule.futureMessage,
      createdAt: new Date().toISOString(),
      position: {
        x: Math.random() * 60 + 20,
        y: 0
      },
      velocity: { x: 0, y: 0 }
    };

    // 즉시 UI 업데이트
    const updatedCapsules = [...capsules, capsule];
    setCapsules(updatedCapsules);

    // Supabase에 저장
    await saveCapsuleToSupabase(capsule);

    setNewCapsule({
      name: '',
      password: '',
      image: null,
      imagePreview: null,
      currentFeeling: '',
      futureMessage: ''
    });

    setShowCreateModal(false);
  };

  const handleTouchStart = (e, capsule) => {
    if (e.target.closest('.capsule-body')) {
      e.preventDefault();
      const touch = e.touches[0];
      const capsuleElement = e.currentTarget;
      const capsuleRect = capsuleElement.getBoundingClientRect();
      
      setDragStartPos({ x: touch.clientX, y: touch.clientY });
      setDragOffset({
        x: touch.clientX - capsuleRect.left,
        y: touch.clientY - capsuleRect.top
      });
      setDraggedCapsule(capsule.id);
      setIsDragging(false);
    }
  };

  const handleTouchMove = (e) => {
    if (draggedCapsule) {
      const touch = e.touches[0];
      const dx = touch.clientX - dragStartPos.x;
      const dy = touch.clientY - dragStartPos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // 10px 이상 움직이면 드래그로 인식
      if (distance > 10) {
        setIsDragging(true);
        e.preventDefault();
      }
      
      const container = document.getElementById('capsule-container');
      if (container) {
        const rect = container.getBoundingClientRect();
        const x = ((touch.clientX - rect.left - dragOffset.x) / rect.width) * 100;
        const y = ((touch.clientY - rect.top - dragOffset.y) / rect.height) * 100;
        
        const clampedX = Math.max(0, Math.min(85, x));
        const clampedY = Math.max(0, Math.min(80, y));
        
        setCapsules(prev => prev.map(cap => 
          cap.id === draggedCapsule 
            ? { ...cap, position: { x: clampedX, y: clampedY }, velocity: { x: 0, y: 0 } }
            : cap
        ));
      }
    }
  };

  const handleTouchEnd = (e, capsule) => {
    if (draggedCapsule) {
      // 드래그하지 않았으면 클릭으로 인식
      if (!isDragging) {
        handleCapsuleClick(capsule);
      } else {
        // 놓을 때 약간의 초기 속도 부여
        const updatedCapsules = capsules.map(cap => 
          cap.id === draggedCapsule 
            ? { ...cap, velocity: { x: (Math.random() - 0.5) * 2, y: 0 } }
            : cap
        );
        setCapsules(updatedCapsules);
        
        // 위치 저장
        const savedCapsule = updatedCapsules.find(c => c.id === draggedCapsule);
        if (savedCapsule) {
          saveCapsuleToSupabase(savedCapsule);
        }
      }
      
      setDraggedCapsule(null);
      setIsDragging(false);
    }
  };

  const handleCapsuleClick = (capsule) => {
    const now = new Date();
    if (now < unlockDate) {
      const remainingTime = unlockDate - now;
      const days = Math.floor(remainingTime / (1000 * 60 * 60 * 24));
      const hours = Math.floor((remainingTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
      alert(`아직 개봉할 수 없습니다!\n${days}일 ${hours}시간 ${minutes}분 후에 열 수 있어요 🔒`);
      return;
    }

    setSelectedCapsule(capsule);
    setShowOpenModal(true);
    setPasswordError('');
    setOpenPassword('');
    setIsUnlocked(false);
  };

  const handlePasswordCheck = () => {
    if (openPassword === selectedCapsule.password) {
      setIsUnlocked(true);
      setPasswordError('');
    } else {
      setPasswordError('비밀번호가 틀렸습니다!');
    }
  };

  const closeOpenModal = () => {
    setShowOpenModal(false);
    setSelectedCapsule(null);
    setIsUnlocked(false);
    setOpenPassword('');
    setPasswordError('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-2xl text-purple-600 font-bold">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 pb-4">
      {/* 헤더 */}
      <div className="sticky top-0 z-40 bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg">
        <div className="px-4 py-4 text-center">
          <h1 className="text-2xl font-bold mb-1">
            🎓 수능 타임캡슐
          </h1>
          <p className="text-sm opacity-90">
            2025년 11월 13일 오후 6시에 열립니다
          </p>
        </div>
      </div>

      {/* 캡슐 생성 버튼 */}
      <div className="px-4 pt-4 pb-3">
        <button
          onClick={() => setShowCreateModal(true)}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-4 px-6 rounded-2xl font-bold text-lg shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
        >
          <Plus size={24} />
          새 캡슐 만들기
        </button>
      </div>

      {/* 캡슐 컨테이너 */}
      <div 
        id="capsule-container"
        className="mx-4 bg-white/30 backdrop-blur-sm rounded-3xl shadow-lg border-2 border-white/50 relative overflow-hidden"
        style={{ height: 'calc(100vh - 200px)', minHeight: '400px' }}
        onTouchMove={handleTouchMove}
      >
        {capsules.map((capsule) => (
          <div
            key={capsule.id}
            className={`absolute ${draggedCapsule === capsule.id ? 'z-50' : 'z-10'}`}
            style={{
              left: `${capsule.position.x}%`,
              top: `${capsule.position.y}%`,
              cursor: 'grab',
              touchAction: 'none'
            }}
            onTouchStart={(e) => handleTouchStart(e, capsule)}
            onTouchEnd={(e) => handleTouchEnd(e, capsule)}
          >
            <div 
              className={`capsule-body ${draggedCapsule === capsule.id ? 'scale-110' : ''}`}
            >
              <div className="relative w-20 h-28">
                {/* 캡슐 상단 */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-16 h-10 bg-gradient-to-b from-pink-400 to-pink-500 rounded-t-full shadow-lg border-2 border-white"></div>
                
                {/* 캡슐 중간 (이름) */}
                <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-16 h-8 bg-white border-2 border-white shadow-lg flex items-center justify-center">
                  <p className="text-xs font-bold text-purple-600 truncate px-1">
                    {capsule.name}
                  </p>
                </div>
                
                {/* 캡슐 하단 (자물쇠) */}
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-16 h-10 bg-gradient-to-t from-blue-400 to-blue-500 rounded-b-full shadow-lg border-2 border-white flex items-center justify-center">
                  <Lock className="text-white" size={16} />
                </div>
                
                {/* 반짝이는 효과 */}
                <div className="absolute top-1 left-1/2 w-1.5 h-1.5 bg-white rounded-full opacity-70 animate-pulse"></div>
              </div>
            </div>
          </div>
        ))}

        {capsules.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center px-4">
              <p className="text-gray-400 text-lg mb-2">아직 생성된 캡슐이 없습니다</p>
              <p className="text-gray-400 text-sm">위 버튼을 눌러 첫 캡슐을 만들어보세요!</p>
            </div>
          </div>
        )}
      </div>

      {/* 캡슐 생성 모달 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold text-purple-600">
                ✨ 타임캡슐 만들기
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <X size={24} className="text-gray-600" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  이름 *
                </label>
                <input
                  type="text"
                  value={newCapsule.name}
                  onChange={(e) => setNewCapsule({...newCapsule, name: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:outline-none text-base"
                  placeholder="이름을 입력하세요"
                  maxLength={20}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  비밀번호 *
                </label>
                <input
                  type="password"
                  value={newCapsule.password}
                  onChange={(e) => setNewCapsule({...newCapsule, password: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:outline-none text-base"
                  placeholder="비밀번호를 입력하세요"
                  maxLength={20}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  <Image className="inline mr-2" size={18} />
                  사진 추가 (선택)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:outline-none text-sm"
                />
                {newCapsule.imagePreview && (
                  <img
                    src={newCapsule.imagePreview}
                    alt="Preview"
                    className="mt-3 w-full h-48 object-cover rounded-xl"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  <Heart className="inline mr-2" size={18} />
                  현재 심정 (선택)
                </label>
                <textarea
                  value={newCapsule.currentFeeling}
                  onChange={(e) => setNewCapsule({...newCapsule, currentFeeling: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:outline-none h-24 resize-none text-base"
                  placeholder="지금의 마음을 적어보세요..."
                  maxLength={500}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  <MessageSquare className="inline mr-2" size={18} />
                  수능 후 나에게 (선택)
                </label>
                <textarea
                  value={newCapsule.futureMessage}
                  onChange={(e) => setNewCapsule({...newCapsule, futureMessage: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:outline-none h-24 resize-none text-base"
                  placeholder="수능 후의 나에게 하고 싶은 말..."
                  maxLength={500}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-xl font-bold active:scale-95 transition-transform"
                >
                  취소
                </button>
                <button
                  onClick={handleCreateCapsule}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 px-6 rounded-xl font-bold active:scale-95 transition-transform"
                >
                  생성
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 캡슐 열기 모달 */}
      {showOpenModal && selectedCapsule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-slide-up">
            {!isUnlocked ? (
              <>
                <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-10">
                  <h2 className="text-xl font-bold text-purple-600">
                    🔒 캡슐 열기
                  </h2>
                  <button
                    onClick={closeOpenModal}
                    className="p-2 hover:bg-gray-100 rounded-full transition"
                  >
                    <X size={24} className="text-gray-600" />
                  </button>
                </div>

                <div className="p-6 text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-pink-400 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Lock className="text-white" size={40} />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-purple-600">
                    {selectedCapsule.name}의 캡슐
                  </h3>
                  <p className="text-gray-600 mb-6">비밀번호를 입력하세요</p>
                  
                  <input
                    type="password"
                    value={openPassword}
                    onChange={(e) => setOpenPassword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handlePasswordCheck()}
                    className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:outline-none mb-4 text-base"
                    placeholder="비밀번호"
                    autoFocus
                  />
                  
                  {passwordError && (
                    <p className="text-red-500 mb-4 text-sm">{passwordError}</p>
                  )}
                  
                  <div className="flex gap-3">
                    <button
                      onClick={closeOpenModal}
                      className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-xl font-bold active:scale-95 transition-transform"
                    >
                      닫기
                    </button>
                    <button
                      onClick={handlePasswordCheck}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 px-6 rounded-xl font-bold active:scale-95 transition-transform"
                    >
                      열기
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-10">
                  <h2 className="text-xl font-bold text-purple-600">
                    🎉 타임캡슐
                  </h2>
                  <button
                    onClick={closeOpenModal}
                    className="p-2 hover:bg-gray-100 rounded-full transition"
                  >
                    <X size={24} className="text-gray-600" />
                  </button>
                </div>

                <div className="p-4">
                  <h3 className="text-xl font-bold mb-4 text-center text-purple-600">
                    {selectedCapsule.name}의 타임캡슐
                  </h3>
                  
                  {selectedCapsule.image && (
                    <div className="mb-4">
                      <img
                        src={selectedCapsule.image}
                        alt="Capsule"
                        className="w-full h-48 object-cover rounded-xl shadow-lg"
                      />
                    </div>
                  )}
                  
                  {selectedCapsule.currentFeeling && (
                    <div className="mb-4 bg-blue-50 p-4 rounded-xl">
                      <h4 className="font-bold text-base mb-2 text-blue-600 flex items-center gap-2">
                        <Heart size={18} />
                        그때의 심정
                      </h4>
                      <p className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">
                        {selectedCapsule.currentFeeling}
                      </p>
                    </div>
                  )}
                  
                  {selectedCapsule.futureMessage && (
                    <div className="mb-4 bg-purple-50 p-4 rounded-xl">
                      <h4 className="font-bold text-base mb-2 text-purple-600 flex items-center gap-2">
                        <MessageSquare size={18} />
                        나에게 보내는 메시지
                      </h4>
                      <p className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">
                        {selectedCapsule.futureMessage}
                      </p>
                    </div>
                  )}
                  
                  <button
                    onClick={closeOpenModal}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 px-6 rounded-xl font-bold active:scale-95 transition-transform mt-4"
                  >
                    닫기
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

