(function() {
  'use strict';

  var state = {
    currentPage: 'cases',
    currentCaseId: null,
    currentMaterialId: null,
    annotations: {},
    editHistory: []
  };

  function loadState() {
    try {
      var saved = localStorage.getItem('opinion-tool-state');
      if (saved) {
        var parsed = JSON.parse(saved);
        state.annotations = parsed.annotations || {};
        state.editHistory = parsed.editHistory || [];
        state.currentCaseId = parsed.currentCaseId || null;
      }
    } catch(e) {}
  }

  function saveState() {
    try {
      localStorage.setItem('opinion-tool-state', JSON.stringify({
        annotations: state.annotations,
        editHistory: state.editHistory,
        currentCaseId: state.currentCaseId
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

  function getAnnotation(caseId, materialId) {
    if (!state.annotations[caseId]) return null;
    return state.annotations[caseId][materialId] || null;
  }

  function setAnnotation(caseId, materialId, annotation) {
    if (!state.annotations[caseId]) state.annotations[caseId] = {};
    state.annotations[caseId][materialId] = annotation;
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
      timestamp: new Date().toLocaleString('zh-CN')
    });
    if (state.editHistory.length > 200) {
      state.editHistory = state.editHistory.slice(-200);
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
      setTimeout(function() { container.removeChild(toast); }, 300);
    }, 2500);
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
  }

  function renderCasesPage() {
    var html = '<div class="page-header"><h1>📚 案例库</h1>';
    html += '<p>选择一个案例开始标注练习，每条材料需完成立场、情绪、主体、受众四项标注</p></div>';
    html += '<div class="cases-grid">';

    CASES.forEach(function(c) {
      var count = getAnnotationCount(c.id);
      var total = c.materials.length;
      var pct = Math.round((count / total) * 100);

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
      html += '<div class="progress-text">已标注 ' + count + '/' + total + ' 条材料</div>';
      html += '</div>';
      html += '</div>';
    });

    html += '</div>';
    return html;
  }

  function renderAnnotatePage() {
    if (!state.currentCaseId) {
      return '<div class="case-prompt">' +
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

    var html = '<div class="page-header" style="display:flex;align-items:center;justify-content:space-between;">';
    html += '<div><h1>🏷️ ' + c.title + '</h1>';
    html += '<p>' + c.category + ' · ' + c.difficulty + ' · 共 ' + totalCount + ' 条材料</p></div>';
    html += '<div style="display:flex;gap:10px;">';
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

      html += '<div class="timeline-item' + (isActive ? ' active' : '') + (isAnnotated ? ' annotated' : '') + '" data-material-id="' + m.id + '">';
      html += '<div class="timeline-dot">';
      html += '<div class="timeline-dot-icon">' + typeInfo.icon + '</div>';
      html += '<div class="timeline-dot-line"></div>';
      html += '</div>';
      html += '<div class="timeline-item-content">';
      html += '<div class="timeline-item-source">';
      html += '<span class="source-badge ' + m.type + '">' + typeInfo.label + '</span>';
      html += '<span class="timeline-item-time">' + m.source + ' · ' + m.timestamp + '</span>';
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

    if (currentMat && annotation && annotation.stance) {
      html += renderHintsPanel(c, currentMat, annotation);
    }

    return html;
  }

  function renderAnnotationForm(c, mat, ann) {
    var html = '<div class="annotation-header">';
    html += '<h3>' + (mat.title || '社交帖文/评论') + '</h3>';
    html += '<div class="annotation-source">' + TYPE_LABELS[mat.type].icon + ' ' + mat.source + ' · ' + mat.timestamp + '</div>';
    html += '</div>';

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
          (ann.stance === 'pro-china' && otherAnn.stance === 'pro-west' ||
           ann.stance === 'pro-west' && otherAnn.stance === 'pro-china')) {
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

  function renderReportPage() {
    if (!state.currentCaseId) {
      return '<div class="report-empty">' +
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
      return '<div class="page-header" style="display:flex;align-items:center;justify-content:space-between;">' +
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

    var html = '<div class="page-header" style="display:flex;align-items:center;justify-content:space-between;">';
    html += '<div><h1>📊 课堂报告 — ' + c.title + '</h1>';
    html += '<p>' + c.category + ' · ' + c.difficulty + ' · 标注完成 ' + doneCount + '/' + totalCount + '</p></div>';
    html += '<div class="report-actions">';
    html += '<a href="#/annotate" class="btn btn-outline" style="text-decoration:none;">← 返回标注</a>';
    html += '<button class="btn btn-primary" id="print-report">🖨️ 打印报告</button>';
    html += '</div></div>';

    html += '<div class="report-wrap">';
    html += '<div class="report-body">';

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

  function findMaterialById(mId) {
    for (var i = 0; i < CASES.length; i++) {
      for (var j = 0; j < CASES[i].materials.length; j++) {
        if (CASES[i].materials[j].id === mId) return CASES[i].materials[j];
      }
    }
    return null;
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
      if (stanceGroups[pair[0]] && stanceGroups[pair[1]]) {
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
      }
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

    var recentHistory = history.slice(-30).reverse();
    recentHistory.forEach(function(h) {
      var mat = findMaterialById(h.materialId);
      var matLabel = mat ? (mat.source + ': ' + (mat.title || '帖文/评论').substring(0, 25)) : h.materialId;
      var fieldLabels = {
        stance: '立场倾向',
        emotion: '情绪强度',
        entities: '涉及主体',
        audience: '可能受众',
        note: '个人批注'
      };

      html += '<div class="history-item">';
      html += '<span class="history-time">' + h.timestamp + '</span>';
      html += '<span class="history-desc">';
      html += '<span class="field-name">' + matLabel + '</span> · ';
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
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  function formatNum(n) {
    if (n >= 10000) return (n / 10000).toFixed(1) + '万';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
    return String(n);
  }

  function bindEvents() {
    var self = this;

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
  }

  function showMaterialDetail(materialId) {
    var mat = findMaterialById(materialId);
    if (!mat) return;

    var overlay = document.createElement('div');
    overlay.className = 'material-detail-overlay';

    var html = '<div class="material-detail-modal">';
    html += '<div class="modal-header">';
    html += '<div>' + TYPE_LABELS[mat.type].icon + ' ' + mat.source + ' · ' + mat.timestamp + '</div>';
    html += '<button class="modal-close" id="modal-close">&times;</button>';
    html += '</div>';
    html += '<div class="modal-body">';
    if (mat.title) html += '<h3 style="margin-bottom:12px;">' + mat.title + '</h3>';
    html += '<div class="material-full-text">' + escapeHtml(mat.content) + '</div>';
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

    document.getElementById('modal-close').addEventListener('click', function() {
      document.body.removeChild(overlay);
    });
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
    var fieldLabels = {
      stance: '立场倾向',
      emotion: '情绪强度',
      entities: '涉及主体',
      audience: '可能受众',
      note: '个人批注'
    };

    if (oldAnnotation) {
      ['stance', 'emotion', 'entities', 'audience', 'note'].forEach(function(field) {
        var oldVal = JSON.stringify(oldAnnotation[field]);
        var newVal = JSON.stringify(newAnnotation[field]);
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

    showToast('🎉 所有材料已标注完成！可查看课堂报告', 'success');
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
