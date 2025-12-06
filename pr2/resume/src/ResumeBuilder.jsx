import React, { useRef, useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Plus, Trash2, Download, PaintBucket, FileText, Menu, X } from 'lucide-react';

function rgbStringToHex(rgbString) {
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
    if (typeof color === 'string' && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color.trim())) {
      const c = color.trim();
      if (c.length === 4) {
        return `#${c[1]}${c[1]}${c[2]}${c[2]}${c[3]}${c[3]}`.toLowerCase();
      }
      return c.toLowerCase();
    }
    if (/^rgba?\(/i.test(color.trim())) {
      const hex = rgbStringToHex(color);
      return hex || fallback;
    }
    if (typeof document !== 'undefined') {
      const el = document.createElement('div');
      el.style.position = 'fixed';
      el.style.left = '-9999px';
      el.style.width = '1px';
      el.style.height = '1px';
      el.style.background = color;
      document.body.appendChild(el);
      const cs = getComputedStyle(el).backgroundColor || getComputedStyle(el).color;
      document.body.removeChild(el);
      if (cs) {
        const hex = rgbStringToHex(cs);
        if (hex) return hex;
      }
    }
  } catch (err) {}
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

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
    const originalBg = element.style.backgroundColor;
    element.style.backgroundColor = '#ffffff';

    const canvas = await html2canvas(element, { scale: 2, useCORS: true, logging: false });
    const imgData = canvas.toDataURL('image/png');

    element.style.backgroundColor = originalBg;

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

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

  const templates = {
    classic: {
      headerClass: 'classic-header',
      accent: safePrimaryColor,
    },
    modern: {
      headerClass: 'modern-header',
      accent: safePrimaryColor,
    },
    clean: {
      headerClass: 'clean-header',
      accent: safePrimaryColor,
    },
  };

  const selectedTemplate = templates[template];

  return (
    <div className="resume-builder" style={{ fontFamily }}>
      {/* Mobile toggle button */}
      <button
        className="mobile-menu-toggle"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        aria-label="Открыть/закрыть меню"
      >
        {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <div className="container">
        {/* Sidebar */}
        <aside className={`sidebar ${isSidebarOpen ? 'sidebar-open' : ''}`}>
          <div className="header-row">
            <h2 className="title">Конструктор резюме</h2>
            <div className="button-group">
              <button onClick={exportToPdf} className="download-btn" title="Скачать PDF">
                <Download size={16} /> Скачать PDF
              </button>
            </div>
          </div>

          <div className="field-group">
            <label className="label">Имя</label>
            <input
              value={profile.name}
              onChange={(e) => updateProfile('name', e.target.value)}
              className="input-base"
            />

            <label className="label">Заголовок / должность</label>
            <input
              value={profile.title}
              onChange={(e) => updateProfile('title', e.target.value)}
              className="input-base"
            />

            <div className="grid-2">
              <div>
                <label className="label">Email</label>
                <input
                  value={profile.email}
                  onChange={(e) => updateProfile('email', e.target.value)}
                  className="input-base"
                />
              </div>
              <div>
                <label className="label">Телефон</label>
                <input
                  value={profile.phone}
                  onChange={(e) => updateProfile('phone', e.target.value)}
                  className="input-base"
                />
              </div>
            </div>

            <label className="label">Город</label>
            <input
              value={profile.location}
              onChange={(e) => updateProfile('location', e.target.value)}
              className="input-base"
            />

            <label className="label">Кратко о себе</label>
            <textarea
              value={profile.summary}
              onChange={(e) => updateProfile('summary', e.target.value)}
              className="textarea-base"
              rows={4}
            />
          </div>

          <div className="section">
            <h3 className="section-title">Навыки</h3>
            <div className="skill-input-row">
              <input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                className="input-base flex-1"
                placeholder="Добавить навык"
                onKeyDown={(e) => e.key === 'Enter' && addSkill()}
              />
              <button onClick={addSkill} className="icon-button">
                <Plus size={16} />
              </button>
            </div>
            <div className="skills-list">
              {skills.map((s, i) => (
                <span key={i} className="skill-tag">
                  {s}
                  <button onClick={() => removeSkill(i)} className="skill-remove">
                    <Trash2 size={14} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="section">
            <div className="section-header">
              <h3 className="section-title">Опыт работы</h3>
              <button onClick={addExperience} className="add-btn">
                <Plus size={14} /> Добавить
              </button>
            </div>
            <div className="experience-list">
              {experience.map((exp) => (
                <div key={exp.id} className="experience-item">
                  <input
                    value={exp.role}
                    onChange={(e) => updateExperience(exp.id, 'role', e.target.value)}
                    className="input-base"
                    placeholder="Должность"
                  />
                  <input
                    value={exp.company}
                    onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                    className="input-base mt-1"
                    placeholder="Компания"
                  />
                  <input
                    value={exp.period}
                    onChange={(e) => updateExperience(exp.id, 'period', e.target.value)}
                    className="input-base mt-1"
                    placeholder="Период"
                  />
                  <textarea
                    value={exp.details}
                    onChange={(e) => updateExperience(exp.id, 'details', e.target.value)}
                    className="textarea-base mt-1"
                    rows={2}
                    placeholder="Описание"
                  />
                  <div className="delete-row">
                    <button onClick={() => removeExperience(exp.id)} className="text-red">
                      <Trash2 size={14} /> Удалить
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="section">
            <div className="section-header">
              <h3 className="section-title">Образование</h3>
              <button onClick={addEducation} className="add-btn">
                <Plus size={14} /> Добавить
              </button>
            </div>
            <div className="education-list">
              {education.map((ed) => (
                <div key={ed.id} className="education-item">
                  <input
                    value={ed.degree}
                    onChange={(e) => updateEducation(ed.id, 'degree', e.target.value)}
                    className="input-base"
                    placeholder="Степень"
                  />
                  <input
                    value={ed.school}
                    onChange={(e) => updateEducation(ed.id, 'school', e.target.value)}
                    className="input-base mt-1"
                    placeholder="Учебное заведение"
                  />
                  <input
                    value={ed.period}
                    onChange={(e) => updateEducation(ed.id, 'period', e.target.value)}
                    className="input-base mt-1"
                    placeholder="Период"
                  />
                  <div className="delete-row">
                    <button onClick={() => removeEducation(ed.id)} className="text-red">
                      <Trash2 size={14} /> Удалить
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="section design-section">
            <h3 className="section-title">Дизайн</h3>
            <div className="design-option">
              <label className="label">Шаблон</label>
              <select
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                className="input-base ml-auto"
              >
                <option value="classic">Classic</option>
                <option value="modern">Modern</option>
                <option value="clean">Clean</option>
              </select>
            </div>

            <div className="design-option">
              <PaintBucket size={16} />
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="color-input"
              />
              <span className="label">Основной цвет</span>
            </div>

            <div className="design-option">
              <label className="label">Шрифт</label>
              <select
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className="input-base ml-auto"
              >
                <option value={`Inter, ui-sans-serif, system-ui`}>Inter</option>
                <option value={`Georgia, serif`}>Georgia</option>
                <option value={`'Courier New', monospace`}>Monospace</option>
              </select>
            </div>
          </div>
        </aside>

        {/* Preview */}
        <main className="preview-container">
          <div className="preview-header">
            <h3 className="preview-title">
              <FileText size={18} /> Предпросмотр
            </h3>
            <div className="preview-hint">A4 — готово для печати</div>
          </div>

          <div className="preview-wrapper">
            <div className="preview-content-container">
              <div
                ref={previewRef}
                className="resume-preview"
                style={{ color: '#111827' }}
              >
                {/* Header */}
                <div
                  className={`resume-header ${selectedTemplate.headerClass}`}
                  style={{
                    background:
                      template === 'modern'
                        ? `linear-gradient(90deg, ${safePrimaryColor}, #06b6d4)`
                        : 'transparent',
                  }}
                >
                  <div className="header-content">
                    <div>
                      <div
                        className="name"
                        style={{
                          color: template === 'modern' ? '#fff' : '#0f172a',
                        }}
                      >
                        {profile.name}
                      </div>
                      <div
                        className="title"
                        style={{
                          color: template === 'modern' ? 'rgba(255,255,255,0.9)' : safePrimaryColor,
                        }}
                      >
                        {profile.title}
                      </div>
                    </div>
                    <div className="contact-info">
                      <div>{profile.email}</div>
                      <div>{profile.phone}</div>
                      <div>{profile.location}</div>
                    </div>
                  </div>
                </div>

                <div className="resume-body">
                  <div className="main-content">
                    <section className="summary-section">
                      <h4
                        className="section-heading"
                        style={{ color: safePrimaryColor }}
                      >
                        Кратко
                      </h4>
                      <p className="summary-text">{profile.summary}</p>
                    </section>

                    <section className="experience-section">
                      <h4
                        className="section-heading"
                        style={{ color: safePrimaryColor }}
                      >
                        Опыт
                      </h4>
                      <div className="experience-items">
                        {experience.map((ex) => (
                          <div key={ex.id} className="experience-entry">
                            <div className="experience-role">
                              <span className="role-title">{ex.role}</span>
                              <span className="company"> — {ex.company}</span>
                            </div>
                            <div className="period">{ex.period}</div>
                            <div className="details">{ex.details}</div>
                          </div>
                        ))}
                      </div>
                    </section>

                    <section className="education-section">
                      <h4
                        className="section-heading"
                        style={{ color: safePrimaryColor }}
                      >
                        Образование
                      </h4>
                      <div className="education-items">
                        {education.map((ed) => (
                          <div key={ed.id} className="education-entry">
                            <div className="degree">{ed.degree}</div>
                            <div className="school-period">
                              {ed.school} — {ed.period}
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>

                  <aside className="sidebar-content">
                    <section className="skills-section">
                      <h4
                        className="section-heading"
                        style={{ color: safePrimaryColor }}
                      >
                        Навыки
                      </h4>
                      <div className="skills-tags">
                        {skills.map((s, i) => (
                          <div key={i} className="skill-item">
                            {s}
                          </div>
                        ))}
                      </div>
                    </section>

                    <section className="contact-section">
                      <h4
                        className="section-heading"
                        style={{ color: safePrimaryColor }}
                      >
                        Контакты
                      </h4>
                      <div className="contact-details">
                        <div>
                          <strong>Email:</strong> {profile.email}
                        </div>
                        <div>
                          <strong>Тел.:</strong> {profile.phone}
                        </div>
                        <div>
                          <strong>Город:</strong> {profile.location}
                        </div>
                      </div>
                    </section>
                  </aside>
                </div>

                <div className="footer">
                  Сделано с помощью Резюмешкин
                </div>
              </div>
            </div>
          </div>

          <div className="hint-text">
            Подсказка: для печати используйте опцию «Скачать PDF» — результат подготовлен под A4.
          </div>
        </main>
      </div>
    </div>
  );
}