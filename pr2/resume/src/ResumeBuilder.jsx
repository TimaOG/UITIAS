
import React, { useRef, useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Plus, Trash2, Download, PaintBucket, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

function rgbStringToHex(rgbString) {
  // rgbString ожидается вида "rgb(r, g, b)" или "rgba(r, g, b, a)" после getComputedStyle
  const m = rgbString.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (!m) return null;
  const r = parseInt(m[1], 10);
  const g = parseInt(m[2], 10);
  const b = parseInt(m[3], 10);
  const toHex = (n) => n.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function resolveColorToHex(color, fallback = '#0ea5a4') {
  try {
    if (!color) return fallback;
    // if already hex
    if (typeof color === 'string' && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color.trim())) {
      const c = color.trim();
      // normalize 3-digit hex to 6-digit
      if (c.length === 4) {
        return `#${c[1]}${c[1]}${c[2]}${c[2]}${c[3]}${c[3]}`.toLowerCase();
      }
      return c.toLowerCase();
    }

    // if rgb(...) or rgba(...) already
    if (/^rgba?\(/i.test(color.trim())) {
      const hex = rgbStringToHex(color);
      return hex || fallback;
    }

    // Try resolving via DOM: set as background on temporary element and read computed style.
    if (typeof document !== 'undefined') {
      const el = document.createElement('div');
      el.style.position = 'fixed';
      el.style.left = '-9999px';
      el.style.width = '1px';
      el.style.height = '1px';
      // try both background and color
      el.style.background = color;
      document.body.appendChild(el);
      const cs = getComputedStyle(el).backgroundColor || getComputedStyle(el).color;
      document.body.removeChild(el);
      if (cs) {
        const hex = rgbStringToHex(cs);
        if (hex) return hex;
      }
    }
  } catch (err) {
    // игнорируем, вернём fallback
    // console.warn('resolveColorToHex failed for', color, err);
  }
  return fallback;
}

export default function ResumeBuilder() {
  const [profile, setProfile] = useState({
    name: 'Иван Иванов',
    title: 'Frontend-разработчик',
    email: 'ivan@example.com',
    phone: '+7 912 345-67-89',
    location: 'Москва, Россия',
    summary:
      'Опытный разработчик, создаю быстрые, доступные и красивые интерфейсы. Люблю чистый код и хорошие дизайны.',
  });

  const [skills, setSkills] = useState(['React', 'TypeScript', 'HTML', 'CSS']);
  const [skillInput, setSkillInput] = useState('');

  const [experience, setExperience] = useState([
    {
      id: 1,
      role: 'Frontend-разработчик',
      company: 'Acme',
      period: '2021 — настоящее время',
      details: 'Разработка SPA, оптимизация производительности, компонентная архитектура.',
    },
  ]);

  const [education, setEducation] = useState([
    { id: 1, degree: 'Бакалавр компьютерных наук', school: 'ГУ', period: '2016 — 2020' },
  ]);

  const [template, setTemplate] = useState('classic');
  const [primaryColor, setPrimaryColor] = useState('#0ea5a4');
  const [safePrimaryColor, setSafePrimaryColor] = useState(resolveColorToHex('#0ea5a4'));
  const [fontFamily, setFontFamily] = useState('Inter, ui-sans-serif, system-ui');

  // Обновляем безопасный цвет при изменении primaryColor
  useEffect(() => {
    const hex = resolveColorToHex(primaryColor, '#0ea5a4');
    setSafePrimaryColor(hex);
  }, [primaryColor]);

  const previewRef = useRef(null);

  function updateProfile(field, value) {
    setProfile((p) => ({ ...p, [field]: value }));
  }

  function addSkill() {
    if (!skillInput.trim()) return;
    setSkills((s) => [...s, skillInput.trim()]);
    setSkillInput('');
  }

  function removeSkill(idx) {
    setSkills((s) => s.filter((_, i) => i !== idx));
  }

  function addExperience() {
    setExperience((ex) => [
      ...ex,
      { id: Date.now(), role: 'Новая позиция', company: '', period: '', details: '' },
    ]);
  }

  function updateExperience(id, field, value) {
    setExperience((ex) => ex.map((e) => (e.id === id ? { ...e, [field]: value } : e)));
  }

  function removeExperience(id) {
    setExperience((ex) => ex.filter((e) => e.id !== id));
  }

  function addEducation() {
    setEducation((ed) => [...ed, { id: Date.now(), degree: 'Новая степень', school: '', period: '' }]);
  }

  function updateEducation(id, field, value) {
    setEducation((ed) => ed.map((e) => (e.id === id ? { ...e, [field]: value } : e)));
  }

  function removeEducation(id) {
    setEducation((ed) => ed.filter((e) => e.id !== id));
  }

  async function exportToPdf() {
    if (!previewRef.current) return;

    const element = previewRef.current;
    // применим фон белым при рендере PDF
    const originalBg = element.style.backgroundColor;
    element.style.backgroundColor = '#ffffff';

    // увеличим scale для лучшего качества
    const canvas = await html2canvas(element, { scale: 2, useCORS: true, logging: false });
    const imgData = canvas.toDataURL('image/png');

    // восстановим фон
    element.style.backgroundColor = originalBg;

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    // параметры изображения в мм
    const imgProps = { width: canvas.width, height: canvas.height };
    const imgWidthMm = pdfWidth;
    const imgHeightMm = (imgProps.height * imgWidthMm) / imgProps.width;

    let heightLeft = imgHeightMm;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidthMm, imgHeightMm);
    heightLeft -= pdfHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeightMm;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidthMm, imgHeightMm);
      heightLeft -= pdfHeight;
    }

    pdf.save((profile.name || 'resume').replace(/\s+/g, '_') + '.pdf');
  }

  // стили шаблонов — используем safePrimaryColor там, где передаётся CSS напрямую
  const templates = {
    classic: {
      headerClass: `bg-white border-b-2 border-gray-100`,
      accent: safePrimaryColor,
    },
    modern: {
      headerClass: `text-white`,
      accent: safePrimaryColor,
    },
    clean: {
      headerClass: `bg-white`,
      accent: safePrimaryColor,
    },
  };

  const selectedTemplate = templates[template];

  return (
    <div className="min-h-screen bg-gray-50 p-6" style={{ fontFamily }}>
      <div className="max-w-7xl mx-auto grid grid-cols-12 gap-6">
        {/* Sidebar */}
        <aside className="col-span-4 bg-white rounded-2xl p-6 shadow-md max-h-[calc(100vh-2rem)] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Конструктор резюме</h2>
            <div className="flex gap-2">
              <button
                onClick={exportToPdf}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500 text-white text-sm"
                title="Скачать PDF"
              >
                <Download size={16} /> Скачать PDF
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium">Имя</label>
            <input
              value={profile.name}
              onChange={(e) => updateProfile('name', e.target.value)}
              className="w-full input-base"
            />

            <label className="block text-sm font-medium">Заголовок / должность</label>
            <input
              value={profile.title}
              onChange={(e) => updateProfile('title', e.target.value)}
              className="w-full input-base"
            />

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium">Email</label>
                <input value={profile.email} onChange={(e) => updateProfile('email', e.target.value)} className="w-full input-base" />
              </div>
              <div>
                <label className="block text-sm font-medium">Телефон</label>
                <input value={profile.phone} onChange={(e) => updateProfile('phone', e.target.value)} className="w-full input-base" />
              </div>
            </div>

            <label className="block text-sm font-medium">Город</label>
            <input value={profile.location} onChange={(e) => updateProfile('location', e.target.value)} className="w-full input-base" />

            <label className="block text-sm font-medium">Кратко о себе</label>
            <textarea value={profile.summary} onChange={(e) => updateProfile('summary', e.target.value)} className="w-full textarea-base" rows={4} />
          </div>

          <div className="mt-4">
            <h3 className="text-sm font-medium mb-2">Навыки</h3>
            <div className="flex gap-2">
              <input value={skillInput} onChange={(e) => setSkillInput(e.target.value)} className="input-base flex-1" placeholder="Добавить навык" onKeyDown={(e) => e.key === 'Enter' && addSkill()} />
              <button onClick={addSkill} className="btn-ghost px-3 py-2 rounded-lg"><Plus size={16} /></button>
            </div>
            <div className="flex gap-2 flex-wrap mt-3">
              {skills.map((s, i) => (
                <span key={i} className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full text-sm">
                  {s}
                  <button onClick={() => removeSkill(i)} className="p-1 rounded-full hover:bg-gray-200"><Trash2 size={14} /></button>
                </span>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Опыт работы</h3>
              <button onClick={addExperience} className="inline-flex items-center gap-2 text-sm">
                <Plus size={14} /> Добавить
              </button>
            </div>

            <div className="space-y-2 mt-2 max-h-48 overflow-auto pr-2">
              {experience.map((exp) => (
                <div key={exp.id} className="p-2 border rounded-lg bg-gray-50">
                  <input value={exp.role} onChange={(e) => updateExperience(exp.id, 'role', e.target.value)} className="w-full input-base" />
                  <input value={exp.company} onChange={(e) => updateExperience(exp.id, 'company', e.target.value)} className="w-full input-base mt-1" placeholder="Компания" />
                  <input value={exp.period} onChange={(e) => updateExperience(exp.id, 'period', e.target.value)} className="w-full input-base mt-1" placeholder="Период" />
                  <textarea value={exp.details} onChange={(e) => updateExperience(exp.id, 'details', e.target.value)} className="w-full textarea-base mt-1" rows={2} />
                  <div className="flex justify-end mt-1">
                    <button onClick={() => removeExperience(exp.id)} className="text-red-500 inline-flex items-center gap-2"><Trash2 size={14} />Удалить</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Образование</h3>
              <button onClick={addEducation} className="inline-flex items-center gap-2 text-sm"><Plus size={14} />Добавить</button>
            </div>

            <div className="space-y-2 mt-2 max-h-48 overflow-auto pr-2">
              {education.map((ed) => (
                <div key={ed.id} className="p-2 border rounded-lg bg-gray-50">
                  <input value={ed.degree} onChange={(e) => updateEducation(ed.id, 'degree', e.target.value)} className="w-full input-base" />
                  <input value={ed.school} onChange={(e) => updateEducation(ed.id, 'school', e.target.value)} className="w-full input-base mt-1" placeholder="Учебное заведение" />
                  <input value={ed.period} onChange={(e) => updateEducation(ed.id, 'period', e.target.value)} className="w-full input-base mt-1" placeholder="Период" />
                  <div className="flex justify-end mt-1"><button onClick={() => removeEducation(ed.id)} className="text-red-500 inline-flex items-center gap-2"><Trash2 size={14} />Удалить</button></div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 border-t pt-4">
            <h3 className="text-sm font-medium mb-2">Дизайн</h3>
            <div className="flex items-center gap-2 mb-2">
              <label className="text-sm">Шаблон</label>
              <select value={template} onChange={(e) => setTemplate(e.target.value)} className="ml-auto input-base">
                <option value="classic">Classic</option>
                <option value="modern">Modern</option>
                <option value="clean">Clean</option>
              </select>
            </div>

            <div className="flex items-center gap-2 mb-2">
              <PaintBucket size={16} />
              <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-12 h-8 p-0 border-0" />
              <span className="text-sm">Основной цвет</span>
            </div>

            <div className="flex items-center gap-2">
              <label>Шрифт</label>
              <select value={fontFamily} onChange={(e) => setFontFamily(e.target.value)} className="ml-auto input-base">
                <option value={`Inter, ui-sans-serif, system-ui`}>Inter</option>
                <option value={`Georgia, serif`}>Georgia</option>
                <option value={`'Courier New', monospace`}>Monospace</option>
              </select>
            </div>
          </div>
        </aside>

        {/* Preview */}
        <main className="col-span-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-medium flex items-center gap-2"><FileText size={18} /> Предпросмотр</h3>
            <div className="text-sm text-gray-500">A4 — готово для печати</div>
          </div>

          <div className="rounded-2xl overflow-hidden shadow-lg border" style={{ background: '#f3f4f6' }}>
            <div className="p-6 bg-transparent flex justify-center">
              <div
                ref={previewRef}
                className="bg-white shadow-sm p-8 w-[210mm] max-w-[780px] print:shadow-none print:border-none"
                style={{ color: '#111827', borderRadius: 8 }}
              >
                {/* Header */}
                <div
                  className={`p-4 rounded-md mb-4 ${template === 'classic' ? 'bg-white border-b' : ''}`}
                  style={{
                    background: template === 'modern' ? `linear-gradient(90deg, ${safePrimaryColor}, #06b6d4)` : 'transparent',
                  }}
                >
                  <div className="flex items-start gap-6">
                    <div>
                      <div className="text-3xl font-bold" style={{ color: template === 'modern' ? '#fff' : '#0f172a' }}>{profile.name}</div>
                      <div className="text-sm font-medium mt-1" style={{ color: template === 'modern' ? 'rgba(255,255,255,0.9)' : safePrimaryColor }}>{profile.title}</div>
                    </div>
                    <div className="ml-auto text-sm text-gray-600" style={{ textAlign: 'right' }}>
                      <div>{profile.email}</div>
                      <div>{profile.phone}</div>
                      <div>{profile.location}</div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6">
                  <div className="col-span-2">
                    <section className="mb-4">
                      <h4 className="text-sm uppercase tracking-wide font-semibold mb-2" style={{ color: safePrimaryColor }}>Кратко</h4>
                      <p className="text-sm leading-relaxed text-gray-700">{profile.summary}</p>
                    </section>

                    <section className="mb-4">
                      <h4 className="text-sm uppercase tracking-wide font-semibold mb-2" style={{ color: safePrimaryColor }}>Опыт</h4>
                      <div className="space-y-3">
                        {experience.map((ex) => (
                          <div key={ex.id}>
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium">{ex.role} — <span className="text-sm text-gray-600">{ex.company}</span></div>
                                <div className="text-xs text-gray-500">{ex.period}</div>
                              </div>
                            </div>
                            <div className="text-sm text-gray-700 mt-1">{ex.details}</div>
                          </div>
                        ))}
                      </div>
                    </section>

                    <section>
                      <h4 className="text-sm uppercase tracking-wide font-semibold mb-2" style={{ color: safePrimaryColor }}>Образование</h4>
                      <div className="space-y-2">
                        {education.map((ed) => (
                          <div key={ed.id}>
                            <div className="font-medium">{ed.degree}</div>
                            <div className="text-xs text-gray-500">{ed.school} — {ed.period}</div>
                          </div>
                        ))}
                      </div>
                    </section>

                  </div>

                  <aside className="col-span-1">
                    <section className="mb-4">
                      <h4 className="text-sm uppercase tracking-wide font-semibold mb-2" style={{ color: safePrimaryColor }}>Навыки</h4>
                      <div className="flex flex-col gap-2">
                        {skills.map((s, i) => (
                          <div key={i} className="text-sm bg-gray-100 px-2 py-1 rounded">{s}</div>
                        ))}
                      </div>
                    </section>

                    <section>
                      <h4 className="text-sm uppercase tracking-wide font-semibold mb-2" style={{ color: safePrimaryColor }}>Контакты</h4>
                      <div className="text-sm text-gray-700">
                        <div><strong>Email:</strong> {profile.email}</div>
                        <div><strong>Тел.:</strong> {profile.phone}</div>
                        <div><strong>Город:</strong> {profile.location}</div>
                      </div>
                    </section>
                  </aside>
                </div>

                <div className="mt-6 text-xs text-gray-400 text-center">Сделано с ❤️ — ResumeBuilder</div>

              </div>
            </div>
          </div>

          <div className="mt-3 text-sm text-gray-500">Подсказка: для печати используйте опцию «Скачать PDF» — результат подготовлен под A4.</div>
        </main>
      </div>

      {/* Простейшие утилитарные стили (Tailwind utility classes ожидаются). */}
      <style>{`
        .input-base { padding: .5rem .75rem; border-radius: .5rem; border: 1px solid #e6e6e6; }
        .textarea-base { padding: .5rem .75rem; border-radius: .5rem; border: 1px solid #e6e6e6; }
        .btn-ghost { background: transparent; border: 1px dashed #e6e6e6; }
      `}</style>
    </div>
  );
}
