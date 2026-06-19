(function() {
  'use strict';

  var state = {
    currentPage: 'cases',
    currentCaseId: null,
    currentMaterialId: null,
    annotations: {},
    editHistory: [],
    teacherReviews: {},
    teacherMode: false,
    studentName: '学生',
    showComparison: false
  };

  function loadState() {
    try {
      var saved = localStorage.getItem('opinion-tool-state');
      if (saved) {
        var parsed = JSON.parse(saved);
        state.annotations = parsed.annotations || {};
        state.editHistory = parsed.editHistory || [];
        state.currentCaseId = parsed.currentCaseId || null;
        state.teacherReviews = parsed.teacherReviews || {};
        state.teacherMode = parsed.teacherMode || false;
        state.studentName = parsed.studentName || '学生';
      }
    } catch(e) {}
  }

  function saveState() {
    try {
      localStorage.setItem('opinion-tool-state', JSON.stringify({
        annotations: state.annotations,
        editHistory: state.editHistory,
        currentCaseId: state.currentCaseId,
        teacherReviews: state.teacherReviews,
        teacherMode: state.teacherMode,
        studentName: state.studentName
      }));
    } catch(e) {}
  }

  function getCase(caseId) {
    return CASES.find(function(c) { return c.id === caseId; });
  }

  function getMaterial(caseId, materialId) {
    var c = getCase(caseId);
    if (!c) return null;
    return c.materials.find(function(m) { return m.id === materialId; });
  }

  function findMaterialById(mId) {
    for (var i = 0; i < CASES.length; i++) {
      for (var j = 0; j < CASES[i].materials.length; j++) {
        if (CASES[i].materials[j].id === mId) return CASES[i].materials[j];
      }
    }
    return null;
  }

  function getAnnotation(caseId, materialId) {
    if (!state.annotations[caseId]) return null;
    return state.annotations[caseId][materialId] || null;
  }

  function setAnnotation(caseId, materialId, annotation) {
    if (!state.annotations[caseId]) state.annotations[caseId] = {};
    state.annotations[caseId][materialId] = annotation;
    saveState();
  }

  function getReferenceAnnotation(caseId, materialId) {
    if (!REFERENCE_ANNOTATIONS[caseId]) return null;
    return REFERENCE_ANNOTATIONS[caseId][materialId] || null;
  }

  function getTeacherReview(caseId, reviewKey) {
    if (!state.teacherReviews[caseId]) return '';
    return state.teacherReviews[caseId][reviewKey] || '';
  }

  function setTeacherReview(caseId, reviewKey, text) {
    if (!state.teacherReviews[caseId]) state.teacherReviews[caseId] = {};
    state.teacherReviews[caseId][reviewKey] = text;
    saveState();
  }

  function getAnnotationCount(caseId) {
    if (!state.annotations[caseId]) return 0;
    return Object.keys(state.annotations[caseId]).filter(function(k) {
      return state.annotations[caseId][k] && state.annotations[caseId][k].stance;
    }).length;
  }

  function addEditHistory(caseId, materialId, field, oldVal, newVal) {
    state.editHistory.push({
      caseId: caseId,
      materialId: materialId,
      field: field,
      oldVal: oldVal,
      newVal: newVal,
      timestamp: new Date().toLocaleString('zh-CN'),
      role: state.teacherMode ? 'teacher' : 'student',
      actorName: state.teacherMode ? '教师' : state.studentName
    });
    if (state.editHistory.length > 500) {
      state.editHistory = state.editHistory.slice(-500);
    }
    saveState();
  }

  function getCaseEditHistory(caseId) {
    return state.editHistory.filter(function(h) { return h.caseId === caseId; });
  }

  function showToast(msg, type) {
    type = type || 'info';
    var container = document.getElementById('toast-container');
    var toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(function() {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(12px)';
      toast.style.transition = '0.3s ease';
      setTimeout(function() { if (toast.parentNode) container.removeChild(toast); }, 300);
    }, 2800);
  }

  function route() {
    var hash = location.hash || '#/';
    if (hash === '#/' || hash === '#') {
      state.currentPage = 'cases';
    } else if (hash === '#/annotate') {
      state.currentPage = 'annotate';
    } else if (hash === '#/report') {
      state.currentPage = 'report';
    } else if (hash.startsWith('#/case/')) {
      var caseId = hash.replace('#/case/', '');
      state.currentCaseId = caseId;
      state.currentMaterialId = null;
      saveState();
      state.currentPage = 'annotate';
      location.hash = '#/annotate';
      return;
    }
    updateNav();
    render();
  }

  function updateNav() {
    var links = document.querySelectorAll('.nav-link');
    links.forEach(function(link) {
      link.classList.remove('active');
      if (link.dataset.page === state.currentPage) {
        link.classList.add('active');
      }
    });

    var modeToggle = document.getElementById('mode-toggle');
    if (modeToggle) {
      modeToggle.textContent = state.teacherMode ? '👨‍🏫 教师模式' : '👩‍🎓 学生模式';
      modeToggle.className = 'mode-toggle' + (state.teacherMode ? ' teacher-mode' : '');
    }

    var studentNameEl = document.getElementById('student-name');
    if (studentNameEl) {
      studentNameEl.textContent = state.studentName;
    }
  }

  function render() {
    var content = document.getElementById('app-content');
    switch(state.currentPage) {
      case 'cases':
        content.innerHTML = renderCasesPage();
        break;
      case 'annotate':
        content.innerHTML = renderAnnotatePage();
        break;
      case 'report':
        content.innerHTML = renderReportPage();
        break;
    }
    bindEvents();
    updateNav();
  }

  function renderModeBar() {
    var html = '<div class="mode-bar">';
    html += '<div class="mode-bar-left">';
    html += '<button id="mode-toggle" class="mode-toggle' + (state.teacherMode ? ' teacher-mode' : '') + '">';
    html += state.teacherMode ? '👨‍🏫 教师模式' : '👩‍🎓 学生模式';
    html += '</button>';
    if (!state.teacherMode) {
      html += '<span class="mode-bar-name">';
      html += '练习者：<input type="text" id="student-name-input" value="' + escapeHtml(state.studentName) + '" placeholder="输入姓名">';
      html += '</span>';
    }
    html += '</div>';
    html += '<div class="mode-bar-right">';
    html += '<button id="export-btn" class="btn btn-outline btn-sm" title="导出练习包">📦 导出</button>';
    html += '<button id="import-btn" class="btn btn-outline btn-sm" title="导入练习包">📥 导入</button>';
    html += '<input type="file" id="import-file" accept=".json" style="display:none;">';
    html += '</div>';
    html += '</div>';
    return html;
  }

  function renderCasesPage() {
    var html = renderModeBar();
    html += '<div class="page-header"><h1>📚 案例库</h1>';
    html += '<p>选择一个案例开始标注练习，每条材料需完成立场、情绪、主体、受众四项标注</p></div>';
    html += '<div class="cases-grid">';

    CASES.forEach(function(c) {
      var count = getAnnotationCount(c.id);
      var total = c.materials.length;
      var pct = Math.round((count / total) * 100);
      var reviewCount = state.teacherReviews[c.id] ? Object.keys(state.teacherReviews[c.id]).length : 0;

      html += '<div class="case-card' + (state.currentCaseId === c.id ? ' active-case' : '') + '" data-case-id="' + c.id + '">';
      html += '<span class="case-card-category">' + c.category + '</span>';
      html += '<div class="case-card-title">' + c.title + '</div>';
      html += '<div class="case-card-desc">' + c.desc + '</div>';
      html += '<div class="case-card-footer">';
      html += '<div class="case-card-tags">';
      c.tags.forEach(function(t) {
        html += '<span class="case-tag">' + t + '</span>';
      });
      html += '</div>';
      html += '<span class="case-card-difficulty difficulty-' + c.difficulty + '">' + c.difficulty + '</span>';
      html += '</div>';
      html += '<div class="case-card-progress">';
      html += '<div class="progress-bar-bg"><div class="progress-bar-fill" style="width:' + pct + '%"></div></div>';
      html += '<div class="progress-text">已标注 ' + count + '/' + total + ' 条' + (reviewCount > 0 ? ' · 👨‍🏫 已点评 ' + reviewCount + ' 处' : '') + '</div>';
      html += '</div>';
      html += '</div>';
    });

    html += '</div>';
    return html;
  }

  function renderAnnotatePage() {
    if (!state.currentCaseId) {
      return renderModeBar() + '<div class="case-prompt">' +
        '<div class="case-prompt-icon">👈</div>' +
        '<h3>请先选择案例</h3>' +
        '<p>返回案例库，选择一个案例开始标注练习</p>' +
        '<a href="#/" class="btn btn-primary" style="margin-top:16px;display:inline-block;text-decoration:none;">前往案例库</a>' +
        '</div>';
    }

    var c = getCase(state.currentCaseId);
    if (!c) return '<p>案例未找到</p>';

    var currentMat = state.currentMaterialId ? getMaterial(c.id, state.currentMaterialId) : null;
    var annotation = currentMat ? getAnnotation(c.id, currentMat.id) : null;
    var doneCount = getAnnotationCount(c.id);
    var totalCount = c.materials.length;

    var html = renderModeBar();
    html += '<div class="page-header" style="display:flex;align-items:center;justify-content:space-between;">';
    html += '<div><h1>🏷️ ' + c.title + '</h1>';
    html += '<p>' + c.category + ' · ' + c.difficulty + ' · 共 ' + totalCount + ' 条材料 · 练习者: ' + escapeHtml(state.studentName) + '</p></div>';
    html += '<div style="display:flex;gap:10px;flex-wrap:wrap;">';
    html += '<button id="toggle-compare" class="btn btn-outline" style="text-decoration:none;">' + (state.showComparison ? '👁️ 隐藏对照' : '🔍 查看参考答案对照') + '</button>';
    html += '<a href="#/" class="btn btn-outline" style="text-decoration:none;">← 返回案例库</a>';
    html += '<a href="#/report" class="btn btn-success" style="text-decoration:none;">查看课堂报告 →</a>';
    html += '</div></div>';

    html += '<div class="annotate-layout">';

    html += '<div class="timeline-panel">';
    html += '<div class="timeline-header"><h3>时间线材料</h3>';
    html += '<span class="timeline-progress">已标注 ' + doneCount + '/' + totalCount + '</span></div>';
    html += '<div class="timeline-list">';

    c.materials.forEach(function(m, idx) {
      var isActive = state.currentMaterialId === m.id;
      var ann = getAnnotation(c.id, m.id);
      var isAnnotated = ann && ann.stance;
      var typeInfo = TYPE_LABELS[m.type];
      var diffInfo = null;
      if (state.showComparison && isAnnotated) {
        diffInfo = computeAnnotationDiff(c.id, m.id, ann);
      }

      html += '<div class="timeline-item' + (isActive ? ' active' : '') + (isAnnotated ? ' annotated' : '') + '" data-material-id="' + m.id + '">';
      html += '<div class="timeline-dot">';
      html += '<div class="timeline-dot-icon">' + typeInfo.icon + '</div>';
      html += '<div class="timeline-dot-line"></div>';
      html += '</div>';
      html += '<div class="timeline-item-content">';
      html += '<div class="timeline-item-source">';
      html += '<span class="source-badge ' + m.type + '">' + typeInfo.label + '</span>';
      html += '<span class="timeline-item-time">' + m.source + ' · ' + m.timestamp + '</span>';
      if (diffInfo && diffInfo.hasDiff) {
        html += '<span class="diff-badge diff-high">⚠️ 差异 ' + diffInfo.score + '/10</span>';
      } else if (diffInfo && !diffInfo.hasDiff) {
        html += '<span class="diff-badge diff-low">✓ 一致</span>';
      }
      html += '</div>';
      if (m.title) {
        html += '<div class="timeline-item-title">' + m.title + '</div>';
      }
      html += '<div class="timeline-item-text">' + escapeHtml(m.content) + '</div>';
      if (m.likes || m.upvotes) {
        html += '<div class="timeline-item-meta">';
        if (m.likes) html += '<span>👍 ' + formatNum(m.likes) + '</span>';
        if (m.reposts) html += '<span>🔄 ' + formatNum(m.reposts) + '</span>';
        if (m.upvotes) html += '<span>⬆️ ' + formatNum(m.upvotes) + '</span>';
        if (m.replies) html += '<span>💬 ' + m.replies + '</span>';
        html += '</div>';
      }
      html += '</div></div>';
    });

    html += '</div></div>';

    html += '<div class="annotation-panel">';
    if (currentMat) {
      html += renderAnnotationForm(c, currentMat, annotation);
    } else {
      html += '<div style="text-align:center;padding:60px 20px;color:var(--text-secondary);">';
      html += '<div style="font-size:32px;margin-bottom:12px;">👆</div>';
      html += '<h3 style="font-size:15px;margin-bottom:6px;color:var(--text);">选择一条材料开始标注</h3>';
      html += '<p style="font-size:13px;">点击左侧时间线中的材料</p>';
      html += '</div>';
    }
    html += '</div>';

    html += '</div>';

    if (currentMat && state.showComparison && annotation && annotation.stance) {
      html += renderComparisonPanel(c, currentMat, annotation);
    }

    if (currentMat && annotation && annotation.stance && !state.showComparison) {
      html += renderHintsPanel(c, currentMat, annotation);
    }

    return html;
  }

  function computeAnnotationDiff(caseId, materialId, ann) {
    var ref = getReferenceAnnotation(caseId, materialId);
    if (!ref) return null;

    var score = 10;
    var diffs = [];

    if (ann.stance !== ref.stance) {
      score -= 4;
      diffs.push({ field: '立场倾向', yours: getStanceLabel(ann.stance), ref: getStanceLabel(ref.stance), weight: 'high' });
    }

    var emoDiff = Math.abs((ann.emotion || 3) - (ref.emotion || 3));
    if (emoDiff >= 2) {
      score -= 2;
      diffs.push({ field: '情绪强度', yours: getEmotionLabel(ann.emotion || 3), ref: getEmotionLabel(ref.emotion || 3), weight: 'mid' });
    }

    var myEntities = ann.entities || [];
    var refEntities = ref.entities || [];
    var entityOverlap = myEntities.filter(function(e) { return refEntities.indexOf(e) !== -1; }).length;
    var entityTotal = Math.max(myEntities.length, refEntities.length, 1);
    if (entityOverlap / entityTotal < 0.5) {
      score -= 2;
      diffs.push({ field: '涉及主体', yours: myEntities.join('、') || '未选', ref: refEntities.join('、'), weight: 'mid' });
    }

    var myAudience = ann.audience || [];
    var refAudience = ref.audience || [];
    var audOverlap = myAudience.filter(function(a) { return refAudience.indexOf(a) !== -1; }).length;
    var audTotal = Math.max(myAudience.length, refAudience.length, 1);
    if (audOverlap / audTotal < 0.5) {
      score -= 2;
      diffs.push({ field: '可能受众', yours: myAudience.join('、') || '未选', ref: refAudience.join('、'), weight: 'low' });
    }

    return { score: Math.max(0, score), hasDiff: diffs.length > 0, diffs: diffs, ref: ref };
  }

  function renderComparisonPanel(c, mat, ann) {
    var diff = computeAnnotationDiff(c.id, mat.id, ann);
    if (!diff) return '';

    var html = '<div class="comparison-panel">';
    html += '<div class="comparison-header">';
    html += '<span class="comparison-title">🔍 参考答案对照分析</span>';
    html += '<span class="comparison-score' + (diff.score >= 7 ? ' score-good' : diff.score >= 4 ? ' score-mid' : ' score-low') + '">';
    html += '一致性评分：' + diff.score + '/10';
    html += '</span></div>';

    if (diff.diffs.length === 0) {
      html += '<div class="comparison-all-good">';
      html += '🎉 太棒了！你的判断与参考完全一致，这说明你对该材料的立场、情绪和受众分析都很准确。';
      html += '</div>';
    } else {
      html += '<div class="comparison-list">';
      diff.diffs.forEach(function(d) {
        html += '<div class="comparison-item diff-weight-' + d.weight + '">';
        html += '<div class="comparison-field">' + d.field + '</div>';
        html += '<div class="comparison-sides">';
        html += '<div class="comparison-side yours">';
        html += '<div class="comparison-side-label">你的判断</div>';
        html += '<div class="comparison-side-value">' + escapeHtml(d.yours) + '</div>';
        html += '</div>';
        html += '<div class="comparison-arrow">→</div>';
        html += '<div class="comparison-side ref">';
        html += '<div class="comparison-side-label">参考标注</div>';
        html += '<div class="comparison-side-value">' + escapeHtml(d.ref) + '</div>';
        html += '</div>';
        html += '</div></div>';
      });
      html += '</div>';
    }

    if (diff.ref && diff.ref.note) {
      html += '<div class="comparison-teacher-note">';
      html += '<div class="comparison-note-label">📝 参考解读</div>';
      html += '<div class="comparison-note-text">' + escapeHtml(diff.ref.note) + '</div>';
      html += '</div>';
    }

    html += '</div>';
    return html;
  }

  function renderAnnotationForm(c, mat, ann) {
    var html = '<div class="annotation-header">';
    html += '<h3>' + (mat.title || '社交帖文/评论') + '</h3>';
    html += '<div class="annotation-source">' + TYPE_LABELS[mat.type].icon + ' ' + mat.source + ' · ' + mat.timestamp;
    if (mat.sourceTier && SOURCE_TIERS[mat.sourceTier]) {
      html += ' · 信源等级: <strong class="source-tier source-tier-' + mat.sourceTier + '">' + mat.sourceTier + '级</strong>';
    }
    html += '</div></div>';

    html += '<div class="annotation-body">';

    html += '<div style="margin-bottom:20px;padding:14px;background:var(--bg);border-radius:8px;font-size:13px;line-height:1.8;color:var(--text);">' + escapeHtml(mat.content) + '</div>';

    if (mat.likes || mat.upvotes) {
      html += '<div style="margin-bottom:20px;display:flex;gap:16px;font-size:12px;color:var(--text-light);">';
      if (mat.likes) html += '<span>👍 ' + formatNum(mat.likes) + '</span>';
      if (mat.reposts) html += '<span>🔄 ' + formatNum(mat.reposts) + '</span>';
      if (mat.upvotes) html += '<span>⬆️ ' + formatNum(mat.upvotes) + '</span>';
      if (mat.replies) html += '<span>💬 ' + mat.replies + '</span>';
      html += '</div>';
    }

    if (state.teacherMode) {
      html += '<div class="teacher-mode-banner">👨‍🏫 教师模式 - 可查看学生标注和参考答案，前往报告页添加点评</div>';
    }

    html += '<div class="annotation-group">';
    html += '<label class="annotation-label">立场倾向<span class="required">*</span></label>';
    html += '<div class="stance-options">';
    STANCE_OPTIONS.forEach(function(s) {
      var selected = ann && ann.stance === s.value;
      html += '<button class="stance-btn' + (selected ? ' selected' : '') + '" data-stance="' + s.value + '">' + s.label + '</button>';
    });
    html += '</div></div>';

    html += '<div class="annotation-group">';
    html += '<label class="annotation-label">情绪强度<span class="required">*</span></label>';
    html += '<div class="emotion-slider-wrap">';
    html += '<input type="range" class="emotion-slider" min="1" max="5" value="' + (ann ? ann.emotion : 3) + '" id="emotion-slider">';
    var emoVal = ann ? ann.emotion : 3;
    var emoOpt = EMOTION_OPTIONS.find(function(e) { return e.value === emoVal; });
    html += '<span class="emotion-value" id="emotion-value">' + emoOpt.emoji + ' ' + emoOpt.label + '</span>';
    html += '</div></div>';

    html += '<div class="annotation-group">';
    html += '<label class="annotation-label">涉及主体</label>';
    html += '<div class="chip-group">';
    ENTITY_OPTIONS.forEach(function(e) {
      var selected = ann && ann.entities && ann.entities.indexOf(e) !== -1;
      html += '<span class="chip' + (selected ? ' selected' : '') + '" data-entity="' + e + '">' + e + '</span>';
    });
    html += '</div></div>';

    html += '<div class="annotation-group">';
    html += '<label class="annotation-label">可能受众</label>';
    html += '<div class="chip-group">';
    AUDIENCE_OPTIONS.forEach(function(a) {
      var selected = ann && ann.audience && ann.audience.indexOf(a) !== -1;
      html += '<span class="chip' + (selected ? ' selected' : '') + '" data-audience="' + a + '">' + a + '</span>';
    });
    html += '</div></div>';

    html += '<div class="annotation-group">';
    html += '<label class="annotation-label">个人批注</label>';
    html += '<textarea class="annotation-note" id="annotation-note" placeholder="记录你对这条材料的分析思考…">' + (ann && ann.note ? escapeHtml(ann.note) : '') + '</textarea>';
    html += '</div>';

    html += '</div>';

    html += '<div class="annotation-footer">';
    html += '<button class="btn btn-primary" id="save-annotation">保存标注</button>';
    html += '<button class="btn btn-outline" id="clear-annotation">清除</button>';
    html += '</div>';

    return html;
  }

  function renderHintsPanel(c, currentMat, ann) {
    var hints = generateHints(c, currentMat, ann);
    if (hints.length === 0) return '';

    var html = '<div class="hints-panel">';
    html += '<div class="hints-header">💡 智能提示</div>';
    html += '<div class="hints-list">';

    hints.forEach(function(h) {
      html += '<div class="hint-item ' + h.type + '">';
      html += '<span class="hint-icon">' + h.icon + '</span>';
      html += '<span class="hint-text">' + h.text + '</span>';
      html += '</div>';
    });

    html += '</div></div>';
    return html;
  }

  function generateHints(c, currentMat, ann) {
    var hints = [];

    c.materials.forEach(function(m) {
      if (m.id === currentMat.id) return;
      var otherAnn = getAnnotation(c.id, m.id);
      if (!otherAnn || !otherAnn.stance) return;

      if (otherAnn.stance === ann.stance) {
        var contentSimilarity = computeSimilarity(currentMat.content, m.content);
        if (contentSimilarity > 0.3) {
          hints.push({
            type: 'narrative-repeat',
            icon: '🔁',
            text: '<strong>叙事重复</strong>：与 <em>' + m.source + '</em> (' + TYPE_LABELS[m.type].label + ') 存在相似叙事，核心立场均为"' + getStanceLabel(ann.stance) + '"，内容重合度约 ' + Math.round(contentSimilarity * 100) + '%。注意是否存在信息源同质化。'
          });
        }
      }

      if (ann.stance && otherAnn.stance && ann.stance !== otherAnn.stance &&
          ((ann.stance === 'pro-china' && otherAnn.stance === 'pro-west') ||
           (ann.stance === 'pro-west' && otherAnn.stance === 'pro-china'))) {
        if (hints.filter(function(h) { return h.type === 'info'; }).length === 0) {
          hints.push({
            type: 'info',
            icon: '⚖️',
            text: '<strong>立场对立</strong>：已标注材料中存在与当前立场截然相反的内容，注意对比分析双方的论据差异。'
          });
        }
      }
    });

    if (currentMat.type === 'social' || currentMat.type === 'comment') {
      if (ann.emotion >= 4) {
        var hasExtremeWords = /GENOCIDE|WARFARE|SUPPRESSION|BULLYING|HYPOCRISY|霸凌|煽动|赤裸裸|恐惧/i.test(currentMat.content);
        if (hasExtremeWords) {
          hints.push({
            type: 'emotional-incitement',
            icon: '🔥',
            text: '<strong>情绪煽动</strong>：该材料情绪强度标注为"' + getEmotionLabel(ann.emotion) + '"，且包含极端用语（如大写强调、强烈价值判断）。此类内容往往旨在激发情绪反应而非提供事实，建议关注其论证是否有实质证据支撑。'
          });
        }
      }
    }

    if (currentMat.type === 'report') {
      var hasSpecificSource = /according to|cited|stated|reported|数据显示|研究指出|据.*报道/i.test(currentMat.content);
      if (!hasSpecificSource && ann.stance && ann.stance !== 'neutral') {
        hints.push({
          type: 'insufficient-evidence',
          icon: '⚠️',
          text: '<strong>证据不足</strong>：该媒体报道未引用具体信息来源或数据支撑，但立场倾向被标注为"' + getStanceLabel(ann.stance) + '"。注意辨别其论述是事实陈述还是观点表达。'
        });
      }
    }

    if (currentMat.type === 'social') {
      var interactionCount = (currentMat.likes || 0) + (currentMat.reposts || 0);
      if (interactionCount > 10000 && ann.emotion >= 3) {
        hints.push({
          type: 'emotional-incitement',
          icon: '📡',
          text: '<strong>高传播高情绪</strong>：该社交帖文互动量达 ' + formatNum(interactionCount) + '，情绪强度为"' + getEmotionLabel(ann.emotion) + '"。高互动+高情绪的内容更易形成信息茧房，注意其传播节点与受众画像。'
        });
      }
    }

    return hints;
  }

  function computeSimilarity(a, b) {
    var wordsA = a.toLowerCase().split(/\s+/);
    var wordsB = b.toLowerCase().split(/\s+/);
    var setA = {};
    wordsA.forEach(function(w) { if (w.length > 4) setA[w] = true; });
    var setB = {};
    wordsB.forEach(function(w) { if (w.length > 4) setB[w] = true; });

    var keysA = Object.keys(setA);
    if (keysA.length === 0) return 0;

    var overlap = 0;
    keysA.forEach(function(k) { if (setB[k]) overlap++; });

    return overlap / Math.max(keysA.length, Object.keys(setB).length);
  }

  function getStanceLabel(value) {
    var opt = STANCE_OPTIONS.find(function(s) { return s.value === value; });
    return opt ? opt.label : value;
  }

  function getEmotionLabel(value) {
    var opt = EMOTION_OPTIONS.find(function(e) { return e.value === value; });
    return opt ? opt.label : '';
  }

  // ========= 报告页 =========
  function renderReportPage() {
    if (!state.currentCaseId) {
      return renderModeBar() + '<div class="report-empty">' +
        '<div class="report-empty-icon">📊</div>' +
        '<h3>暂无报告数据</h3>' +
        '<p>请先在案例库选择案例并完成标注，然后查看课堂报告</p>' +
        '<a href="#/" class="btn btn-primary" style="margin-top:16px;display:inline-block;text-decoration:none;">前往案例库</a>' +
        '</div>';
    }

    var c = getCase(state.currentCaseId);
    if (!c) return '<p>案例未找到</p>';

    var doneCount = getAnnotationCount(c.id);
    var totalCount = c.materials.length;
    var annotations = state.annotations[c.id] || {};

    if (doneCount === 0) {
      return renderModeBar() + '<div class="page-header" style="display:flex;align-items:center;justify-content:space-between;">' +
        '<div><h1>📊 课堂报告 — ' + c.title + '</h1>' +
        '<p>' + c.category + ' · ' + c.difficulty + '</p></div>' +
        '<a href="#/annotate" class="btn btn-outline" style="text-decoration:none;">← 返回标注</a></div>' +
        '<div class="report-empty">' +
        '<div class="report-empty-icon">✏️</div>' +
        '<h3>尚未开始标注</h3>' +
        '<p>请先完成材料标注，报告将根据你的标注自动生成</p>' +
        '<a href="#/annotate" class="btn btn-primary" style="margin-top:16px;display:inline-block;text-decoration:none;">前往标注</a>' +
        '</div>';
    }

    var html = renderModeBar();
    html += '<div class="page-header" style="display:flex;align-items:center;justify-content:space-between;">';
    html += '<div><h1>📊 课堂报告 — ' + c.title + '</h1>';
    html += '<p>' + c.category + ' · ' + c.difficulty + ' · 标注完成 ' + doneCount + '/' + totalCount + ' · 练习者: ' + escapeHtml(state.studentName) + '</p></div>';
    html += '<div class="report-actions">';
    html += '<a href="#/annotate" class="btn btn-outline" style="text-decoration:none;">← 返回标注</a>';
    html += '<button class="btn btn-primary" id="print-report">🖨️ 打印报告</button>';
    html += '</div></div>';

    html += '<div class="report-wrap">';
    html += '<div class="report-body">';

    html += renderEvidenceChainScore(c, annotations);

    html += '<div class="stats-row">';
    html += '<div class="stat-card"><div class="stat-card-value">' + doneCount + '/' + totalCount + '</div><div class="stat-card-label">标注完成</div></div>';
    html += '<div class="stat-card"><div class="stat-card-value">' + countByType(annotations, 'report') + '</div><div class="stat-card-label">媒体报道</div></div>';
    html += '<div class="stat-card"><div class="stat-card-value">' + countByType(annotations, 'social') + '</div><div class="stat-card-label">社交帖文</div></div>';
    html += '<div class="stat-card"><div class="stat-card-value">' + countByType(annotations, 'comment') + '</div><div class="stat-card-label">评论片段</div></div>';
    html += '</div>';

    html += renderStanceDistribution(c, annotations);
    html += renderEmotionDistribution(c, annotations);
    html += renderNarrativeLines(c, annotations);
    html += renderDivergencePoints(c, annotations);
    html += renderPropagationNodes(c, annotations);
    html += renderTeacherReviewsSection(c);
    html += renderEditHistory(c);

    html += '</div></div>';
    return html;
  }

  function countByType(annotations, type) {
    var count = 0;
    Object.keys(annotations).forEach(function(mId) {
      var ann = annotations[mId];
      if (ann && ann.stance) {
        var mat = findMaterialById(mId);
        if (mat && mat.type === type) count++;
      }
    });
    return count;
  }

  // ===== 证据链评分模块 =====
  function renderEvidenceChainScore(c, annotations) {
    var result = computeEvidenceChainScore(c, annotations);

    var html = '<div class="evidence-score-panel">';
    html += '<div class="evidence-score-header">';
    html += '<span class="evidence-score-title">🎯 证据链研判完整度评分</span>';
    html += '<span class="evidence-score-badge' + (result.total >= 70 ? ' score-good' : result.total >= 40 ? ' score-mid' : ' score-low') + '">' + result.total + '/100</span>';
    html += '</div>';

    html += '<div class="evidence-score-summary">' + result.summary + '</div>';

    html += '<div class="evidence-dim-grid">';

    result.dimensions.forEach(function(dim) {
      html += '<div class="evidence-dim-card">';
      html += '<div class="evidence-dim-header">';
      html += '<span class="evidence-dim-icon">' + dim.icon + '</span>';
      html += '<span class="evidence-dim-label">' + dim.label + '</span>';
      html += '<span class="evidence-dim-score" style="color:' + dim.color + '">' + dim.score + '/' + dim.max + '</span>';
      html += '</div>';
      html += '<div class="evidence-dim-bar-bg">';
      html += '<div class="evidence-dim-bar-fill" style="width:' + (dim.score / dim.max * 100) + '%;background:' + dim.color + ';"></div>';
      html += '</div>';
      html += '<div class="evidence-dim-desc">' + dim.desc + '</div>';
      html += '</div>';
    });

    html += '</div>';

    if (result.warnings.length > 0) {
      html += '<div class="evidence-warnings">';
      html += '<div class="evidence-warnings-title">⚠️ 教师关注点</div>';
      html += '<ul>';
      result.warnings.forEach(function(w) {
        html += '<li>' + w + '</li>';
      });
      html += '</ul></div>';
    }

    html += '</div>';
    return html;
  }

  function computeEvidenceChainScore(c, annotations) {
    var dims = [];
    var warnings = [];
    var total = 0;
    var maxTotal = 0;

    // 1. 证据来源覆盖度 (max 25)
    var tierCounts = { A: 0, B: 0, C: 0, D: 0 };
    var tierAnnotated = { A: 0, B: 0, C: 0, D: 0 };
    c.materials.forEach(function(m) {
      if (m.sourceTier && tierCounts[m.sourceTier] !== undefined) tierCounts[m.sourceTier]++;
      var ann = getAnnotation(c.id, m.id);
      if (m.sourceTier && ann && ann.stance && tierAnnotated[m.sourceTier] !== undefined) tierAnnotated[m.sourceTier]++;
    });

    var sourceCoverage = 0;
    var sourceMax = 25;
    Object.keys(tierCounts).forEach(function(t) {
      if (tierCounts[t] > 0 && tierAnnotated[t] === tierCounts[t]) sourceCoverage += 6;
      else if (tierCounts[t] > 0 && tierAnnotated[t] > 0) sourceCoverage += 3;
    });
    sourceCoverage = Math.min(sourceCoverage, sourceMax);
    total += sourceCoverage;
    maxTotal += sourceMax;

    var uncovered = [];
    Object.keys(tierCounts).forEach(function(t) {
      if (tierCounts[t] > 0 && tierAnnotated[t] === 0) uncovered.push(t + '级');
    });

    dims.push({
      icon: '📰',
      label: '证据来源覆盖度',
      score: sourceCoverage,
      max: sourceMax,
      color: sourceCoverage >= sourceMax * 0.7 ? '#10b981' : sourceCoverage >= sourceMax * 0.4 ? '#f59e0b' : '#ef4444',
      desc: '涵盖A(权威)、B(次级)、C(社交)、D(评论)四个信源层级的标注覆盖情况'
    });

    if (uncovered.length > 0) {
      warnings.push('尚未覆盖 ' + uncovered.join('、') + ' 信源层级，建议补充标注以获得更完整的舆论图景');
    }

    // 2. 情绪强度分布 (max 25)
    var emotionCounts = [0, 0, 0, 0, 0];
    var annotatedMats = [];
    c.materials.forEach(function(m) {
      var ann = getAnnotation(c.id, m.id);
      if (ann && ann.emotion) {
        emotionCounts[ann.emotion - 1]++;
        annotatedMats.push({ mat: m, ann: ann });
      }
    });

    var emotionScore = 0;
    var emotionMax = 25;
    var nonZeroLevels = emotionCounts.filter(function(c) { return c > 0; }).length;
    emotionScore = Math.round(nonZeroLevels / 5 * emotionMax);

    // 高情绪材料必须有批注
    var highEmoWithoutNote = annotatedMats.filter(function(item) {
      return item.ann.emotion >= 4 && (!item.ann.note || item.ann.note.trim() === '');
    }).length;
    if (highEmoWithoutNote > 0) {
      emotionScore = Math.max(0, emotionScore - highEmoWithoutNote * 3);
      warnings.push(highEmoWithoutNote + ' 条高情绪（≥4级）材料未写批注，情绪类材料应重点标注分析理由');
    }

    total += emotionScore;
    maxTotal += emotionMax;

    dims.push({
      icon: '🌡️',
      label: '情绪强度分布识别',
      score: emotionScore,
      max: emotionMax,
      color: emotionScore >= emotionMax * 0.7 ? '#10b981' : emotionScore >= emotionMax * 0.4 ? '#f59e0b' : '#ef4444',
      desc: '是否识别了从冷静客观到极端煽动各层级的情绪分布'
    });

    // 3. 主体覆盖广度 (max 25)
    var allEntities = {};
    var coveredEntities = {};
    c.materials.forEach(function(m) {
      var ref = getReferenceAnnotation(c.id, m.id);
      if (ref && ref.entities) ref.entities.forEach(function(e) { allEntities[e] = true; });
      var ann = getAnnotation(c.id, m.id);
      if (ann && ann.entities) ann.entities.forEach(function(e) { coveredEntities[e] = true; });
    });

    var entityKeys = Object.keys(allEntities);
    var coveredCount = Object.keys(coveredEntities).length;
    var entityScore = entityKeys.length > 0 ? Math.round(coveredCount / entityKeys.length * 25) : 0;
    total += entityScore;
    maxTotal += 25;

    var missedEntities = entityKeys.filter(function(e) { return !coveredEntities[e]; });
    if (missedEntities.length > 0) {
      warnings.push('遗漏了重要主体: ' + missedEntities.slice(0, 5).join('、') + (missedEntities.length > 5 ? ' 等' : ''));
    }

    dims.push({
      icon: '🏛️',
      label: '涉及主体识别广度',
      score: entityScore,
      max: 25,
      color: entityScore >= 17 ? '#10b981' : entityScore >= 10 ? '#f59e0b' : '#ef4444',
      desc: '识别出的关键主体占案例全部核心主体的比例'
    });

    // 4. 传播节点识别 (max 25)
    var propScore = 0;
    var propMax = 25;
    var interactions = annotatedMats.map(function(item) {
      return {
        mat: item.mat,
        interaction: (item.mat.likes || 0) + (item.mat.reposts || 0) + (item.mat.upvotes || 0),
        ann: item.ann
      };
    }).sort(function(a, b) { return b.interaction - a.interaction; });

    var top3 = interactions.slice(0, 3);
    var top3Annotated = top3.filter(function(item) { return item.ann && item.ann.stance; }).length;
    propScore = Math.round(top3Annotated / 3 * propMax);
    total += propScore;
    maxTotal += propMax;

    if (top3Annotated < top3.length) {
      warnings.push('互动量前3的高传播节点尚未全部标注，这些节点对舆论传播影响最大');
    }

    dims.push({
      icon: '📡',
      label: '传播节点覆盖',
      score: propScore,
      max: propMax,
      color: propScore >= propMax * 0.7 ? '#10b981' : propScore >= propMax * 0.4 ? '#f59e0b' : '#ef4444',
      desc: '互动量最高的关键传播节点标注覆盖率'
    });

    var totalPct = Math.round(total / maxTotal * 100);
    var summary = '';
    if (totalPct >= 75) {
      summary = '✨ 研判分析完整度优秀，覆盖了多个信源层级、情绪分布和核心主体，适合作为课堂优秀案例展示。';
    } else if (totalPct >= 50) {
      summary = '📝 研判分析基本完整，但仍有改进空间。建议补充标注高传播节点、高情绪材料批注，并关注遗漏的重要主体。';
    } else {
      summary = '⚠️ 研判分析偏单一，建议多角度覆盖不同信源、识别更多核心主体，并完成所有关键传播节点的标注。';
    }

    return {
      total: totalPct,
      summary: summary,
      dimensions: dims,
      warnings: warnings
    };
  }

  // ===== 教师点评模块 =====
  function renderTeacherReviewsSection(c) {
    var narrativeKey = 'narrative';
    var divergenceKey = 'divergence';
    var propagationKey = 'propagation';
    var generalKey = 'general';

    var sections = [
      { key: narrativeKey, title: '主线叙事点评', icon: '📝' },
      { key: divergenceKey, title: '分歧点点评', icon: '⚡' },
      { key: propagationKey, title: '传播节点点评', icon: '📡' },
      { key: generalKey, title: '综合评语', icon: '👨‍🏫' }
    ];

    var html = '<div class="report-section">';
    html += '<div class="report-section-title"><span class="icon">👨‍🏫</span> 教师点评区';
    if (!state.teacherMode) {
      html += '<span class="section-subtitle">（学生视图，仅可查看不可编辑）</span>';
    }
    html += '</div>';

    sections.forEach(function(sec) {
      var review = getTeacherReview(c.id, sec.key);
      html += '<div class="teacher-review-card">';
      html += '<div class="teacher-review-header">';
      html += '<span class="teacher-review-icon">' + sec.icon + '</span>';
      html += '<span class="teacher-review-title">' + sec.title + '</span>';
      html += '</div>';

      if (state.teacherMode) {
        html += '<textarea class="teacher-review-input" data-review-key="' + sec.key + '" placeholder="在此写入您对该部分的点评意见…">' + escapeHtml(review) + '</textarea>';
      } else {
        if (review && review.trim()) {
          html += '<div class="teacher-review-content">' + escapeHtml(review).replace(/\n/g, '<br>') + '</div>';
        } else {
          html += '<div class="teacher-review-empty">教师尚未点评</div>';
        }
      }
      html += '</div>';
    });

    if (state.teacherMode) {
      html += '<div style="margin-top:16px;"><button class="btn btn-primary" id="save-teacher-reviews">💾 保存所有点评</button></div>';
    }

    html += '</div>';
    return html;
  }

  function renderStanceDistribution(c, annotations) {
    var stanceCounts = {};
    STANCE_OPTIONS.forEach(function(s) { stanceCounts[s.value] = 0; });

    Object.keys(annotations).forEach(function(mId) {
      var ann = annotations[mId];
      if (ann && ann.stance) {
        stanceCounts[ann.stance] = (stanceCounts[ann.stance] || 0) + 1;
      }
    });

    var total = 0;
    Object.keys(stanceCounts).forEach(function(k) { total += stanceCounts[k]; });
    if (total === 0) return '';

    var html = '<div class="report-section">';
    html += '<div class="report-section-title"><span class="icon">🎯</span> 立场分布</div>';

    html += '<div class="stance-chart">';
    STANCE_OPTIONS.forEach(function(s) {
      if (stanceCounts[s.value] > 0) {
        var pct = (stanceCounts[s.value] / total * 100);
        html += '<div class="stance-segment" style="width:' + pct + '%;background:' + s.color + ';"></div>';
      }
    });
    html += '</div>';

    html += '<div class="stance-legend">';
    STANCE_OPTIONS.forEach(function(s) {
      if (stanceCounts[s.value] > 0) {
        html += '<div class="stance-legend-item">';
        html += '<span class="stance-legend-dot" style="background:' + s.color + ';"></span>';
        html += s.label + ' (' + stanceCounts[s.value] + ')';
        html += '</div>';
      }
    });
    html += '</div></div>';

    return html;
  }

  function renderEmotionDistribution(c, annotations) {
    var emotionCounts = [0, 0, 0, 0, 0];
    var total = 0;

    Object.keys(annotations).forEach(function(mId) {
      var ann = annotations[mId];
      if (ann && ann.emotion) {
        emotionCounts[ann.emotion - 1]++;
        total++;
      }
    });

    if (total === 0) return '';

    var maxCount = Math.max.apply(null, emotionCounts);

    var html = '<div class="report-section">';
    html += '<div class="report-section-title"><span class="icon">🌡️</span> 情绪强度分布</div>';
    html += '<div class="emotion-chart">';

    EMOTION_OPTIONS.forEach(function(e, idx) {
      var height = maxCount > 0 ? (emotionCounts[idx] / maxCount * 60 + 4) : 4;
      var colors = ['#10b981', '#34d399', '#f59e0b', '#f97316', '#ef4444'];
      html += '<div class="emotion-bar-wrap">';
      html += '<div class="emotion-bar" style="height:' + height + 'px;background:' + colors[idx] + ';"></div>';
      html += '<div class="emotion-bar-label">' + e.emoji + ' ' + emotionCounts[idx] + '</div>';
      html += '</div>';
    });

    html += '</div></div>';
    return html;
  }

  function renderNarrativeLines(c, annotations) {
    var stanceGroups = {};
    Object.keys(annotations).forEach(function(mId) {
      var ann = annotations[mId];
      if (ann && ann.stance) {
        if (!stanceGroups[ann.stance]) stanceGroups[ann.stance] = [];
        stanceGroups[ann.stance].push({ materialId: mId, annotation: ann });
      }
    });

    var html = '<div class="report-section">';
    html += '<div class="report-section-title"><span class="icon">📝</span> 主线叙事</div>';

    var sortedGroups = Object.keys(stanceGroups).sort(function(a, b) {
      return stanceGroups[b].length - stanceGroups[a].length;
    });

    if (sortedGroups.length === 0) {
      html += '<div class="narrative-line"><div class="narrative-line-text" style="color:var(--text-secondary);">暂无足够标注数据</div></div>';
    }

    sortedGroups.forEach(function(stance) {
      var label = getStanceLabel(stance);
      var items = stanceGroups[stance];
      var count = items.length;
      var sources = [];
      var entities = [];

      items.forEach(function(item) {
        var mat = findMaterialById(item.materialId);
        if (mat && sources.indexOf(mat.source) === -1) sources.push(mat.source);
        if (item.annotation.entities) {
          item.annotation.entities.forEach(function(e) {
            if (entities.indexOf(e) === -1) entities.push(e);
          });
        }
      });

      html += '<div class="narrative-line">';
      html += '<div class="narrative-line-label">' + label + ' · ' + count + '条材料</div>';
      html += '<div class="narrative-line-text">涉及信息源：' + sources.join('、') + '；';
      if (entities.length > 0) {
        html += '涉及主体：' + entities.join('、') + '；';
      }
      html += '该叙事线在' + (count >= 3 ? '多' : '少数') + '条材料中反复出现。</div>';
      html += '</div>';
    });

    html += '</div>';
    return html;
  }

  function renderDivergencePoints(c, annotations) {
    var stanceGroups = {};
    Object.keys(annotations).forEach(function(mId) {
      var ann = annotations[mId];
      if (ann && ann.stance) {
        if (!stanceGroups[ann.stance]) stanceGroups[ann.stance] = [];
        stanceGroups[ann.stance].push({ materialId: mId, annotation: ann });
      }
    });

    var opposingPairs = [
      ['pro-china', 'pro-west'],
      ['pro-west', 'pro-china'],
      ['pro-developing', 'pro-west']
    ];

    var divergences = [];

    opposingPairs.forEach(function(pair) {
      if (stanceGroups[pair[0]] && stanceGroups[pair[1]] && pair[0] < pair[1] ? true : (pair[0] !== 'pro-west' && pair[1] !== 'pro-china') || (pair[0] === 'pro-west' && pair[1] === 'pro-developing')) {
        var sideA = stanceGroups[pair[0]];
        var sideB = stanceGroups[pair[1]];
        if (!sideA || !sideB) return;
        if (pair[0] === 'pro-china' && pair[1] === 'pro-west') {
          // skip duplicate
        }
      }
    });

    divergences = [];
    var processedPairs = {};
    opposingPairs.forEach(function(pair) {
      var pairKey = [pair[0], pair[1]].sort().join('-');
      if (processedPairs[pairKey]) return;
      processedPairs[pairKey] = true;
      if (!stanceGroups[pair[0]] || !stanceGroups[pair[1]]) return;

      var sideA = stanceGroups[pair[0]];
      var sideB = stanceGroups[pair[1]];

      var entitiesA = [];
      var entitiesB = [];
      sideA.forEach(function(i) {
        if (i.annotation.entities) i.annotation.entities.forEach(function(e) {
          if (entitiesA.indexOf(e) === -1) entitiesA.push(e);
        });
      });
      sideB.forEach(function(i) {
        if (i.annotation.entities) i.annotation.entities.forEach(function(e) {
          if (entitiesB.indexOf(e) === -1) entitiesB.push(e);
        });
      });

      var sharedEntities = entitiesA.filter(function(e) { return entitiesB.indexOf(e) !== -1; });

      var sideASources = sideA.map(function(i) {
        var m = findMaterialById(i.materialId);
        return m ? m.source : '';
      }).filter(Boolean);
      var sideBSources = sideB.map(function(i) {
        var m = findMaterialById(i.materialId);
        return m ? m.source : '';
      }).filter(Boolean);

      divergences.push({
        stanceA: pair[0],
        stanceB: pair[1],
        countA: sideA.length,
        countB: sideB.length,
        sourcesA: sideASources.slice(0, 3),
        sourcesB: sideBSources.slice(0, 3),
        sharedEntities: sharedEntities
      });
    });

    if (divergences.length === 0) return '';

    var html = '<div class="report-section">';
    html += '<div class="report-section-title"><span class="icon">⚡</span> 分歧点</div>';
    html += '<div class="divergence-grid">';

    divergences.forEach(function(d) {
      html += '<div class="divergence-card">';
      html += '<div class="divergence-card-title">⚖️ ' + getStanceLabel(d.stanceA) + ' vs ' + getStanceLabel(d.stanceB) + '</div>';
      html += '<div class="divergence-card-sides">';
      html += '<div class="divergence-side ' + getDivergenceSideClass(d.stanceA) + '">';
      html += '<strong>' + d.countA + '条材料</strong><br>';
      html += d.sourcesA.join('、');
      html += '</div>';
      html += '<div class="divergence-side ' + getDivergenceSideClass(d.stanceB) + '">';
      html += '<strong>' + d.countB + '条材料</strong><br>';
      html += d.sourcesB.join('、');
      html += '</div>';
      html += '</div>';
      if (d.sharedEntities.length > 0) {
        html += '<div style="margin-top:8px;font-size:12px;color:var(--text-secondary);">共同关注主体：' + d.sharedEntities.join('、') + '</div>';
      }
      html += '</div>';
    });

    html += '</div></div>';
    return html;
  }

  function getDivergenceSideClass(stance) {
    if (stance === 'pro-china') return 'pro-china';
    if (stance === 'pro-west') return 'pro-west';
    return 'other';
  }

  function renderPropagationNodes(c, annotations) {
    var annotatedMaterials = [];

    c.materials.forEach(function(m) {
      var ann = getAnnotation(c.id, m.id);
      if (ann && ann.stance) {
        annotatedMaterials.push({ material: m, annotation: ann });
      }
    });

    if (annotatedMaterials.length === 0) return '';

    var maxInteraction = 0;
    annotatedMaterials.forEach(function(item) {
      var interaction = (item.material.likes || 0) + (item.material.reposts || 0) + (item.material.upvotes || 0);
      if (interaction > maxInteraction) maxInteraction = interaction;
    });

    var html = '<div class="report-section">';
    html += '<div class="report-section-title"><span class="icon">📡</span> 传播节点</div>';
    html += '<div class="propagation-timeline">';

    annotatedMaterials.forEach(function(item) {
      var interaction = (item.material.likes || 0) + (item.material.reposts || 0) + (item.material.upvotes || 0);
      var isKey = maxInteraction > 0 && interaction >= maxInteraction * 0.6;

      html += '<div class="propagation-node' + (isKey ? ' key' : '') + '">';
      html += '<div class="propagation-node-time">' + item.material.timestamp + '</div>';
      html += '<div class="propagation-node-content">';
      html += TYPE_LABELS[item.material.type].icon + ' ';
      html += (item.material.title || item.material.content.substring(0, 40) + '…');
      html += ' — <em>' + item.material.source + '</em>';
      html += '</div>';
      html += '<span class="propagation-node-badge ' + (isKey ? 'key-node' : 'normal') + '">';
      html += isKey ? '🔑 关键节点' : '普通传播';
      if (interaction > 0) html += ' · 互动 ' + formatNum(interaction);
      html += '</span>';
      html += '</div>';
    });

    html += '</div></div>';
    return html;
  }

  function renderEditHistory(c) {
    var history = getCaseEditHistory(c.id);
    if (history.length === 0) return '';

    var html = '<div class="report-section">';
    html += '<div class="report-section-title"><span class="icon">📝</span> 修改痕迹</div>';
    html += '<div class="edit-history">';

    var recentHistory = history.slice(-40).reverse();
    var fieldLabels = {
      stance: '立场倾向',
      emotion: '情绪强度',
      entities: '涉及主体',
      audience: '可能受众',
      note: '个人批注',
      review: '教师点评'
    };

    recentHistory.forEach(function(h) {
      var mat = findMaterialById(h.materialId);
      var matLabel = mat ? (mat.source + ': ' + ((mat.title || '帖文/评论').substring(0, 25))) : h.materialId;
      var roleLabel = h.role === 'teacher' ? '👨‍🏫 ' : '👩‍🎓 ';
      var actorLabel = h.actorName || (h.role === 'teacher' ? '教师' : state.studentName);

      html += '<div class="history-item">';
      html += '<span class="history-time">' + h.timestamp + '</span>';
      html += '<span class="history-desc">';
      html += roleLabel + '<strong>' + escapeHtml(actorLabel) + '</strong> · ';
      html += '<span class="field-name">' + escapeHtml(matLabel) + '</span> · ';
      html += (fieldLabels[h.field] || h.field) + '：';
      if (h.oldVal) html += '<span class="old-val">' + truncate(String(h.oldVal), 20) + '</span> → ';
      html += '<span class="new-val">' + truncate(String(h.newVal), 20) + '</span>';
      html += '</span></div>';
    });

    html += '</div></div>';
    return html;
  }

  function truncate(str, len) {
    if (!str) return '';
    return str.length > len ? str.substring(0, len) + '…' : str;
  }

  function escapeHtml(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  function formatNum(n) {
    if (!n) return '0';
    if (n >= 10000) return (n / 10000).toFixed(1) + '万';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
    return String(n);
  }

  // ===== 导入导出 =====
  function exportPracticePackage() {
    if (!state.currentCaseId) {
      showToast('请先选择要导出的案例', 'error');
      return;
    }
    var c = getCase(state.currentCaseId);
    if (!c) return;

    var packageData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      caseId: c.id,
      caseTitle: c.title,
      caseData: c,
      studentName: state.studentName,
      annotations: state.annotations[c.id] || {},
      editHistory: getCaseEditHistory(c.id),
      teacherReviews: state.teacherReviews[c.id] || {}
    };

    var blob = new Blob([JSON.stringify(packageData, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = '舆论练习包_' + c.title + '_' + state.studentName + '_' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('练习包已导出', 'success');
  }

  function importPracticePackage(file) {
    var reader = new FileReader();
    reader.onload = function(e) {
      try {
        var data = JSON.parse(e.target.result);
        if (!data.caseId || !data.annotations) {
          showToast('无效的练习包文件', 'error');
          return;
        }

        state.currentCaseId = data.caseId;
        if (data.studentName) state.studentName = data.studentName;
        if (!state.annotations[data.caseId]) state.annotations[data.caseId] = {};
        Object.keys(data.annotations).forEach(function(k) {
          state.annotations[data.caseId][k] = data.annotations[k];
        });

        if (Array.isArray(data.editHistory)) {
          data.editHistory.forEach(function(h) { state.editHistory.push(h); });
        }

        if (data.teacherReviews) {
          if (!state.teacherReviews[data.caseId]) state.teacherReviews[data.caseId] = {};
          Object.keys(data.teacherReviews).forEach(function(k) {
            state.teacherReviews[data.caseId][k] = data.teacherReviews[k];
          });
        }

        saveState();
        showToast('练习包导入成功！', 'success');
        render();
      } catch(err) {
        console.error(err);
        showToast('导入失败：文件格式错误', 'error');
      }
    };
    reader.readAsText(file);
  }

  // ===== 事件绑定 =====
  function bindEvents() {
    document.querySelectorAll('.case-card').forEach(function(card) {
      card.addEventListener('click', function() {
        state.currentCaseId = card.dataset.caseId;
        state.currentMaterialId = null;
        saveState();
        location.hash = '#/annotate';
      });
    });

    document.querySelectorAll('.timeline-item').forEach(function(item) {
      item.addEventListener('click', function() {
        state.currentMaterialId = item.dataset.materialId;
        render();
        var activeItem = document.querySelector('.timeline-item.active');
        if (activeItem) {
          activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      });

      item.addEventListener('dblclick', function() {
        showMaterialDetail(item.dataset.materialId);
      });
    });

    document.querySelectorAll('.stance-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        document.querySelectorAll('.stance-btn').forEach(function(b) { b.classList.remove('selected'); });
        btn.classList.add('selected');
      });
    });

    var slider = document.getElementById('emotion-slider');
    if (slider) {
      slider.addEventListener('input', function() {
        var val = parseInt(slider.value);
        var opt = EMOTION_OPTIONS.find(function(e) { return e.value === val; });
        var valSpan = document.getElementById('emotion-value');
        if (valSpan && opt) valSpan.textContent = opt.emoji + ' ' + opt.label;
      });
    }

    document.querySelectorAll('.chip[data-entity]').forEach(function(chip) {
      chip.addEventListener('click', function() {
        chip.classList.toggle('selected');
      });
    });

    document.querySelectorAll('.chip[data-audience]').forEach(function(chip) {
      chip.addEventListener('click', function() {
        chip.classList.toggle('selected');
      });
    });

    var saveBtn = document.getElementById('save-annotation');
    if (saveBtn) {
      saveBtn.addEventListener('click', function() {
        saveCurrentAnnotation();
      });
    }

    var clearBtn = document.getElementById('clear-annotation');
    if (clearBtn) {
      clearBtn.addEventListener('click', function() {
        clearCurrentAnnotation();
      });
    }

    var printBtn = document.getElementById('print-report');
    if (printBtn) {
      printBtn.addEventListener('click', function() {
        window.print();
      });
    }

    var toggleCompare = document.getElementById('toggle-compare');
    if (toggleCompare) {
      toggleCompare.addEventListener('click', function() {
        state.showComparison = !state.showComparison;
        render();
      });
    }

    var modeToggle = document.getElementById('mode-toggle');
    if (modeToggle) {
      modeToggle.addEventListener('click', function() {
        state.teacherMode = !state.teacherMode;
        saveState();
        showToast(state.teacherMode ? '已切换为教师模式' : '已切换为学生模式', 'info');
        render();
      });
    }

    var nameInput = document.getElementById('student-name-input');
    if (nameInput) {
      nameInput.addEventListener('change', function() {
        state.studentName = nameInput.value.trim() || '学生';
        saveState();
        showToast('姓名已保存', 'success');
      });
    }

    var exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', exportPracticePackage);
    }

    var importBtn = document.getElementById('import-btn');
    var importFile = document.getElementById('import-file');
    if (importBtn && importFile) {
      importBtn.addEventListener('click', function() { importFile.click(); });
      importFile.addEventListener('change', function(e) {
        if (e.target.files && e.target.files[0]) {
          importPracticePackage(e.target.files[0]);
        }
      });
    }

    var saveReviewsBtn = document.getElementById('save-teacher-reviews');
    if (saveReviewsBtn) {
      saveReviewsBtn.addEventListener('click', function() {
        document.querySelectorAll('.teacher-review-input').forEach(function(ta) {
          var key = ta.dataset.reviewKey;
          var oldVal = getTeacherReview(state.currentCaseId, key) || '';
          var newVal = ta.value;
          if (oldVal !== newVal) {
            addEditHistory(state.currentCaseId, 'review-' + key, 'review', oldVal, newVal);
            setTeacherReview(state.currentCaseId, key, newVal);
          }
        });
        showToast('教师点评已保存', 'success');
        render();
      });
    }
  }

  function showMaterialDetail(materialId) {
    var mat = findMaterialById(materialId);
    if (!mat) return;

    var overlay = document.createElement('div');
    overlay.className = 'material-detail-overlay';

    var html = '<div class="material-detail-modal">';
    html += '<div class="modal-header">';
    html += '<div>' + TYPE_LABELS[mat.type].icon + ' ' + mat.source + ' · ' + mat.timestamp +
      (mat.sourceTier && SOURCE_TIERS[mat.sourceTier] ? ' · 信源等级: ' + mat.sourceTier : '') + '</div>';
    html += '<button class="modal-close" id="modal-close">&times;</button>';
    html += '</div>';
    html += '<div class="modal-body">';
    if (mat.title) html += '<h3 style="margin-bottom:12px;">' + escapeHtml(mat.title) + '</h3>';
    html += '<div class="material-full-text">' + escapeHtml(mat.content) + '</div>';
    if (mat.sourceTier && SOURCE_TIERS[mat.sourceTier]) {
      html += '<div style="margin-top:16px;padding:12px;background:var(--primary-light);border-radius:8px;font-size:12px;color:var(--primary);">';
      html += '📊 信源等级说明：<strong>' + mat.sourceTier + '级</strong> — ' + SOURCE_TIERS[mat.sourceTier].label;
      html += '</div>';
    }
    var ref = state.currentCaseId ? getReferenceAnnotation(state.currentCaseId, materialId) : null;
    if (ref) {
      html += '<div style="margin-top:12px;padding:12px;background:var(--success-light);border-radius:8px;font-size:12px;color:#065f46;">';
      html += '💡 参考解读：' + escapeHtml(ref.note || '');
      html += '</div>';
    }
    if (mat.likes || mat.upvotes) {
      html += '<div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--border);display:flex;gap:16px;font-size:13px;color:var(--text-secondary);">';
      if (mat.likes) html += '<span>👍 ' + formatNum(mat.likes) + '</span>';
      if (mat.reposts) html += '<span>🔄 ' + formatNum(mat.reposts) + '</span>';
      if (mat.upvotes) html += '<span>⬆️ ' + formatNum(mat.upvotes) + '</span>';
      if (mat.replies) html += '<span>💬 ' + mat.replies + ' 条回复</span>';
      html += '</div>';
    }
    html += '</div></div>';

    overlay.innerHTML = html;
    document.body.appendChild(overlay);

    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) {
        document.body.removeChild(overlay);
      }
    });

    var closeBtn = document.getElementById('modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', function() {
        if (overlay.parentNode) document.body.removeChild(overlay);
      });
    }
  }

  function saveCurrentAnnotation() {
    if (!state.currentCaseId || !state.currentMaterialId) return;

    var stance = document.querySelector('.stance-btn.selected');
    var slider = document.getElementById('emotion-slider');
    var noteEl = document.getElementById('annotation-note');

    if (!stance) {
      showToast('请先选择立场倾向', 'error');
      return;
    }

    var entities = [];
    document.querySelectorAll('.chip[data-entity].selected').forEach(function(c) {
      entities.push(c.dataset.entity);
    });

    var audience = [];
    document.querySelectorAll('.chip[data-audience].selected').forEach(function(c) {
      audience.push(c.dataset.audience);
    });

    var newAnnotation = {
      stance: stance.dataset.stance,
      emotion: slider ? parseInt(slider.value) : 3,
      entities: entities,
      audience: audience,
      note: noteEl ? noteEl.value : '',
      savedAt: new Date().toISOString()
    };

    var oldAnnotation = getAnnotation(state.currentCaseId, state.currentMaterialId);

    if (oldAnnotation) {
      ['stance', 'emotion', 'entities', 'audience', 'note'].forEach(function(field) {
        var oldVal = oldAnnotation[field] !== null && oldAnnotation[field] !== undefined ? JSON.stringify(oldAnnotation[field]) : '';
        var newVal = newAnnotation[field] !== null && newAnnotation[field] !== undefined ? JSON.stringify(newAnnotation[field]) : '';
        if (oldVal !== newVal) {
          addEditHistory(
            state.currentCaseId,
            state.currentMaterialId,
            field,
            oldAnnotation[field] !== null && oldAnnotation[field] !== undefined ? String(oldAnnotation[field]) : '',
            newAnnotation[field] !== null && newAnnotation[field] !== undefined ? String(newAnnotation[field]) : ''
          );
        }
      });
    } else {
      addEditHistory(state.currentCaseId, state.currentMaterialId, 'stance', '', newAnnotation.stance);
    }

    setAnnotation(state.currentCaseId, state.currentMaterialId, newAnnotation);
    showToast('标注已保存', 'success');
    render();

    autoSelectNextMaterial();
  }

  function autoSelectNextMaterial() {
    var c = getCase(state.currentCaseId);
    if (!c) return;

    var currentIdx = -1;
    c.materials.forEach(function(m, idx) {
      if (m.id === state.currentMaterialId) currentIdx = idx;
    });

    for (var i = currentIdx + 1; i < c.materials.length; i++) {
      var ann = getAnnotation(c.id, c.materials[i].id);
      if (!ann || !ann.stance) {
        state.currentMaterialId = c.materials[i].id;
        render();
        return;
      }
    }

    showToast('🎉 所有材料已标注完成！可查看课堂报告或打开参考答案对照', 'success');
  }

  function clearCurrentAnnotation() {
    if (!state.currentCaseId || !state.currentMaterialId) return;

    var oldAnnotation = getAnnotation(state.currentCaseId, state.currentMaterialId);
    if (oldAnnotation) {
      addEditHistory(state.currentCaseId, state.currentMaterialId, 'stance', oldAnnotation.stance || '', '（已清除）');
    }

    if (state.annotations[state.currentCaseId]) {
      delete state.annotations[state.currentCaseId][state.currentMaterialId];
    }
    saveState();
    showToast('标注已清除', 'info');
    render();
  }

  function init() {
    loadState();
    window.addEventListener('hashchange', route);
    route();
  }

  init();
})();
