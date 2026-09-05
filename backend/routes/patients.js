const router = require('express').Router();
const crypto = require('crypto');
const PDFDocument = require('pdfkit');
const { requireAuth } = require('../middleware/auth');
const Patient = require('../models/Patient');
const Prediction = require('../models/Prediction');

router.use(requireAuth);

const CONFIG = {
  cardiovascular: {
    label: 'Cardiovascular',
    models: ['RandomForest', 'XGBoost', 'SVM', 'HybridQuantum'],
    classical: ['RandomForest', 'XGBoost', 'SVM'],
    features: ['age', 'gender', 'height', 'weight', 'ap_hi', 'ap_lo', 'cholesterol', 'gluc', 'smoke', 'alco', 'active', 'bmi'],
  },
  diabetes: {
    label: 'Diabetes',
    models: ['LogisticRegression', 'RandomForest', 'FinetunedHybridQML'],
    classical: ['LogisticRegression', 'RandomForest'],
    features: ['gender', 'age', 'hypertension', 'heart_disease', 'smoking_history', 'bmi', 'HbA1c_level', 'blood_glucose_level'],
  },
};

const LABELS = {
  RandomForest: 'Random Forest',
  XGBoost: 'XGBoost',
  SVM: 'SVM (RBF)',
  HybridQuantum: 'Hybrid Quantum',
  LogisticRegression: 'Logistic Regression',
  FinetunedHybridQML: 'Finetuned Hybrid QML',
};

function conditionLabel(condition) { return CONFIG[condition]?.label || 'Assessment'; }
function configFor(condition) { return CONFIG[condition] || CONFIG.cardiovascular; }

function metricRows(metrics) {
  return Object.entries(metrics || {}).map(([model, value]) => [
    LABELS[model] || model,
    typeof value?.accuracy === 'number' ? `${(value.accuracy * 100).toFixed(1)}%` : '—',
    typeof value?.sensitivity === 'number' ? `${(value.sensitivity * 100).toFixed(1)}%` : '—',
    typeof value?.specificity === 'number' ? `${(value.specificity * 100).toFixed(1)}%` : '—',
    typeof value?.f1 === 'number' ? `${(value.f1 * 100).toFixed(1)}%` : '—',
    typeof value?.roc_auc === 'number' ? value.roc_auc.toFixed(3) : '—',
  ]);
}

function riskLevel(probability) {
  if (typeof probability !== 'number' || Number.isNaN(probability)) return 'unknown';
  // Product display bands only; they are not clinically validated thresholds.
  if (probability >= 0.70) return 'high';
  if (probability >= 0.40) return 'moderate';
  return 'low';
}

function summarize(condition, results) {
  const cfg = configFor(condition);
  const hybrid = results.find((x) => x.model === 'HybridQuantum' || x.model === 'FinetunedHybridQML');
  const classical = results.filter((x) => cfg.classical.includes(x.model));
  const probabilities = classical.map((x) => x.probability).filter((x) => typeof x === 'number');
  const classicalAverage = probabilities.length
    ? probabilities.reduce((sum, value) => sum + value, 0) / probabilities.length
    : null;
  const probability = typeof hybrid?.probability === 'number' ? hybrid.probability : classicalAverage;
  return {
    probability,
    probabilitySource: typeof hybrid?.probability === 'number' ? hybrid.model : probabilities.length ? 'classical-average' : null,
    riskLevel: riskLevel(probability),
    positiveVotes: results.filter((x) => x.prediction === 1).length,
    negativeVotes: results.filter((x) => x.prediction === 0).length,
    modelsRun: results.length,
    classicalModelsWithProbability: probabilities.length,
    bandDefinition: 'Display-only model band; not a clinically validated threshold.',
  };
}

function indicators(condition, patient) {
  if (condition === 'diabetes') {
    const values = [];
    if (Number(patient.bmi) >= 30) values.push('BMI in obesity range');
    if (Number(patient.HbA1c_level) >= 6.5) values.push('Higher HbA1c value');
    if (Number(patient.blood_glucose_level) >= 126) values.push('Higher blood glucose value');
    if (Number(patient.hypertension) === 1) values.push('Hypertension recorded');
    if (Number(patient.heart_disease) === 1) values.push('Heart disease recorded');
    if (['current', 'former'].includes(String(patient.smoking_history))) values.push('Smoking history recorded');
    return values;
  }

  const values = [];
  if (Number(patient.ap_hi) >= 140 || Number(patient.ap_lo) >= 90) values.push('Elevated blood pressure');
  if (Number(patient.cholesterol) > 1) values.push('Higher cholesterol category');
  if (Number(patient.gluc) > 1) values.push('Higher glucose category');
  if (Number(patient.bmi) >= 30) values.push('BMI in obesity range');
  if (Number(patient.smoke) === 1) values.push('Smoking');
  if (Number(patient.active) === 0) values.push('Low physical activity');
  return values;
}

function buildFeatures(condition, patient) {
  if (condition === 'diabetes') {
    return {
      gender: patient.diabetesGender,
      age: patient.age,
      hypertension: patient.hypertension,
      heart_disease: patient.heart_disease,
      smoking_history: patient.smoking_history,
      bmi: patient.bmi,
      HbA1c_level: patient.HbA1c_level,
      blood_glucose_level: patient.blood_glucose_level,
    };
  }
  return {
    age: patient.age,
    gender: patient.gender,
    height: patient.height,
    weight: patient.weight,
    ap_hi: patient.ap_hi,
    ap_lo: patient.ap_lo,
    cholesterol: patient.cholesterol,
    gluc: patient.gluc,
    smoke: patient.smoke,
    alco: patient.alco,
    active: patient.active,
    bmi: patient.bmi,
  };
}

function validatePatient(condition, body) {
  const finite = (value) => typeof value === 'number' && Number.isFinite(value);
  const required = condition === 'diabetes'
    ? ['age', 'bmi', 'HbA1c_level', 'blood_glucose_level', 'hypertension', 'heart_disease']
    : ['age', 'gender', 'height', 'weight', 'ap_hi', 'ap_lo', 'cholesterol', 'gluc', 'smoke', 'alco', 'active', 'bmi'];

  for (const key of required) {
    if (body[key] === undefined || body[key] === null || body[key] === '' || !finite(Number(body[key]))) {
      return `${key} is required and must be valid`;
    }
  }

  if (condition === 'diabetes' && !['Female', 'Male', 'Other'].includes(String(body.diabetesGender))) {
    return 'Please select a valid gender for the diabetes assessment';
  }
  if (condition === 'diabetes' && !['No Info', 'current', 'ever', 'former', 'never', 'not current'].includes(String(body.smoking_history))) {
    return 'Please select a valid smoking history for the diabetes assessment';
  }
  if (condition === 'cardiovascular' && Number(body.ap_hi) <= Number(body.ap_lo)) {
    return 'Systolic blood pressure must be higher than diastolic blood pressure';
  }
  return null;
}

async function runModel(mlUrl, condition, model, features) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 180000);
  try {
    const response = await fetch(`${mlUrl}/predict`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ condition, model, features }),
      signal: controller.signal,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.detail || `${model} inference failed`);
    return data;
  } catch (error) {
    if (error.name === 'AbortError') throw new Error(`${model} inference timed out after 180 seconds`);
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function modelRows(condition, predictions) {
  return configFor(condition).models.map((model) => {
    const prediction = predictions.find((item) => item.model === model);
    return prediction || { model, unavailable: true };
  });
}

function groupAssessments(predictions) {
  const map = new Map();
  for (const prediction of predictions) {
    const key = prediction.assessmentId || String(prediction.createdAt);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(prediction);
  }
  return [...map.entries()]
    .map(([assessmentId, items]) => ({
      assessmentId,
      condition: items[0].condition,
      createdAt: items.reduce(
        (latest, item) => new Date(item.createdAt) > new Date(latest) ? item.createdAt : latest,
        items[0].createdAt,
      ),
      items,
      summary: {
        probability: items.find((item) => typeof item.assessmentProbability === 'number')?.assessmentProbability ?? null,
        riskLevel: items.find((item) => item.riskLevel && item.riskLevel !== 'unknown')?.riskLevel ?? 'unknown',
      },
    }))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function safeName(value) { return String(value || 'patient').replace(/[^a-zA-Z0-9_-]/g, '_'); }

function drawTable(doc, headers, rows, widths) {
  const x0 = doc.x;
  let y = doc.y;
  const rowHeight = 24;
  doc.font('Helvetica-Bold').fontSize(8);
  headers.forEach((header, index) => {
    let x = x0 + widths.slice(0, index).reduce((a, b) => a + b, 0);
    doc.rect(x, y, widths[index], rowHeight).fillAndStroke('#f2f5f3', '#d9e0dd');
    doc.fillColor('#26332f').text(String(header), x + 5, y + 7, { width: widths[index] - 10, lineBreak: false });
  });
  y += rowHeight;
  doc.font('Helvetica').fontSize(7.8);
  for (const row of rows) {
    let x = x0;
    row.forEach((value, index) => {
      doc.fillColor('#26332f').rect(x, y, widths[index], rowHeight).stroke('#e3e8e5');
      doc.text(String(value ?? '—'), x + 5, y + 7, { width: widths[index] - 10, lineBreak: false, ellipsis: true });
      x += widths[index];
    });
    y += rowHeight;
  }
  doc.y = y + 10;
}

function drawLineChart(doc, points, title) {
  if (!points || !points.length) return;
  const startX = doc.x;
  const startY = doc.y + 6;
  const chartWidth = 490;
  const chartHeight = 110;

  doc.fillColor('#26332f').font('Helvetica-Bold').fontSize(9.5).text(title, startX, startY);

  const boxY = startY + 14;
  doc.rect(startX, boxY, chartWidth, chartHeight).fillAndStroke('#f8faf9', '#d9e0dd');

  doc.strokeColor('#d0dad4').lineWidth(0.5);
  doc.moveTo(startX, boxY + chartHeight / 2).lineTo(startX + chartWidth, boxY + chartHeight / 2).dash(3, { space: 3 }).stroke().undash();

  doc.fillColor('#7a8b84').font('Helvetica').fontSize(7);
  doc.text('100%', startX + 4, boxY + 4);
  doc.text('50%', startX + 4, boxY + chartHeight / 2 - 4);
  doc.text('0%', startX + 4, boxY + chartHeight - 11);

  if (points.length === 1) {
    const pt = points[0];
    const x = startX + chartWidth / 2;
    const y = boxY + 10 + (1 - Math.max(0, Math.min(1, pt.value))) * (chartHeight - 24);
    doc.circle(x, y, 4).fillAndStroke('#ffffff', '#0f3d38');
    doc.fillColor('#26332f').font('Helvetica-Bold').fontSize(7.5).text(`${(pt.value * 100).toFixed(1)}%`, x - 20, y - 10, { width: 40, align: 'center' });
    doc.fillColor('#7a8b84').font('Helvetica').fontSize(7).text('Run 1', x - 20, boxY + chartHeight - 11, { width: 40, align: 'center' });
    doc.y = boxY + chartHeight + 12;
    return;
  }

  const pad = 40;
  const plotW = chartWidth - pad * 2;
  const plotH = chartHeight - 24;

  const coords = points.map((pt, i) => {
    const x = startX + pad + (i * plotW) / Math.max(1, points.length - 1);
    const y = boxY + 10 + (1 - Math.max(0, Math.min(1, pt.value))) * plotH;
    return { x, y, value: pt.value, label: pt.label };
  });

  doc.strokeColor('#0f3d38').lineWidth(2);
  doc.moveTo(coords[0].x, coords[0].y);
  for (let i = 1; i < coords.length; i++) {
    doc.lineTo(coords[i].x, coords[i].y);
  }
  doc.stroke();

  coords.forEach((pt, i) => {
    doc.circle(pt.x, pt.y, 3.5).fillAndStroke('#ffffff', '#0f3d38');
    doc.fillColor('#26332f').font('Helvetica-Bold').fontSize(7.5).text(`${(pt.value * 100).toFixed(1)}%`, pt.x - 18, pt.y - 10, { width: 36, align: 'center' });
    doc.fillColor('#7a8b84').font('Helvetica').fontSize(7).text(`Run ${i + 1}`, pt.x - 18, boxY + chartHeight - 11, { width: 36, align: 'center' });
  });

  doc.y = boxY + chartHeight + 12;
}

async function buildReport({ patient, condition, assessments, latest, rows, riskIndicators, modelInfo }) {
  return new Promise((resolve, reject) => {
    const label = conditionLabel(condition);
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 44, bottom: 44, left: 48, right: 48 },
      info: { Title: `BioSync ${label} Assessment — ${patient.name}` },
    });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const heading = (title, size = 12) => {
      doc.fillColor('#26332f').font('Helvetica-Bold').fontSize(size).text(title);
      doc.moveDown(0.35);
    };
    const note = (text) => {
      doc.fillColor('#6b7772').font('Helvetica').fontSize(8.2).text(text, { width: 495 });
      doc.moveDown(0.35);
    };

    doc.fillColor('#0f3d38').font('Helvetica-Bold').fontSize(22).text('BioSync');
    doc.fillColor('#26332f').fontSize(16).text(`${label} Assessment Report`);
    note(`Generated ${new Date().toLocaleString()}`);

    heading('Patient summary');
    doc.fillColor('#26332f').font('Helvetica').fontSize(9.2);
    doc.text(`Name: ${patient.name}    Patient ID: ${patient.patientId}    Age: ${patient.age}`);
    if (condition === 'diabetes') {
      doc.text(`Gender: ${patient.diabetesGender}    BMI: ${patient.bmi}    HbA1c: ${patient.HbA1c_level}    Blood glucose: ${patient.blood_glucose_level}`);
      doc.text(`Hypertension: ${Number(patient.hypertension) ? 'Yes' : 'No'}    Heart disease: ${Number(patient.heart_disease) ? 'Yes' : 'No'}    Smoking: ${patient.smoking_history}`);
    } else {
      doc.text(`Gender: ${Number(patient.gender) === 1 ? 'Male' : 'Female'}    Height: ${patient.height} cm    Weight: ${patient.weight} kg    BMI: ${patient.bmi}`);
      doc.text(`Blood pressure: ${patient.ap_hi}/${patient.ap_lo} mmHg    Cholesterol: ${patient.cholesterol}    Glucose: ${patient.gluc}`);
    }
    doc.moveDown(0.7);

    heading('Latest assessment');
    if (latest) {
      const probability = latest.summary.probability;
      doc.fillColor('#0f3d38').font('Helvetica-Bold').fontSize(18).text(typeof probability === 'number' ? `${(probability * 100).toFixed(1)}%` : 'No classical probability');
      note(latest.summary.probabilitySource && latest.summary.probabilitySource !== 'classical-average' ? 'Hybrid model output; not a clinically validated probability or diagnosis.' : 'Model-derived summary from available classical models; not a clinically validated probability or diagnosis.');
    } else {
      note('No completed assessment is available.');
    }

    heading('Model results');
    drawTable(doc, ['Model', 'Prediction', 'Probability / score', 'Status'], rows.map((prediction) => [
      LABELS[prediction.model] || prediction.model,
      prediction.unavailable ? 'Unavailable' : prediction.prediction === 1 ? 'Positive' : 'Negative',
      prediction.unavailable ? '—' : typeof prediction.probability === 'number' ? `${(prediction.probability * 100).toFixed(1)}%` : typeof prediction.decisionScore === 'number' ? `Decision ${prediction.decisionScore.toFixed(3)}` : 'Not probabilistic',
      prediction.unavailable ? 'Not run' : 'Completed',
    ]), [145, 90, 145, 100]);
    note('Positive/negative is a model class label, not a diagnosis. Quantum decision scores are not probabilities.');

    heading('Relevant submitted-value indicators');
    if (riskIndicators.length) {
      riskIndicators.forEach((indicator) => doc.font('Helvetica').fontSize(8.8).fillColor('#26332f').text(indicator));
    } else {
      note('No prominent indicators were identified from the submitted fields.');
    }

    doc.addPage();
    if (condition === 'diabetes') {
      const fair = modelInfo?.fair_same_feature_benchmark?.models || {};
      const production = modelInfo?.production_test_set?.models || {};
      heading('Direct classical vs hybrid-QML benchmark');
      note('Same four numeric features and the same held-out 1,000-row test split. QML values are supplied test evidence; classical baselines were independently retrained from the supplied training split.');
      if (Object.keys(fair).length) drawTable(doc, ['Model', 'Accuracy', 'Sensitivity', 'Specificity', 'F1', 'ROC-AUC'], metricRows(fair), [115, 70, 78, 78, 55, 74]);
      else note('No direct same-feature benchmark is available.');
      heading('Production classical baselines', 11);
      note('These use the full eight-feature Diabetes production input contract and are kept separate from the direct quantum comparison.');
      if (Object.keys(production).length) drawTable(doc, ['Model', 'Accuracy', 'Sensitivity', 'Specificity', 'F1', 'ROC-AUC'], metricRows(production), [115, 70, 78, 78, 55, 74]);
      note('Test set: 1,000 rows; positive prevalence: 8.5%. Accuracy is interpreted alongside sensitivity, specificity, F1 and ROC-AUC.');
    } else {
      heading('Evaluation evidence');
      const performance = modelInfo?.test_set?.models || {};
      if (Object.keys(performance).length) drawTable(doc, ['Model', 'Accuracy', 'Sensitivity', 'Specificity', 'F1', 'ROC-AUC'], metricRows(performance), [115, 70, 78, 78, 55, 74]);
      else note('No supplied evaluation table is available for this condition.');
    }

    doc.addPage();
    heading('Assessment history');
    const history = assessments.slice(0, 12).map((assessment) => [
      new Date(assessment.createdAt).toLocaleDateString(),
      assessment.items.map((item) => LABELS[item.model] || item.model).join(', '),
      assessment.summary.riskLevel,
    ]);
    if (history.length) drawTable(doc, ['Date', 'Models run', 'Band'], history, [110, 290, 70]);
    else note('No assessment history is available.');

    const chartPoints = assessments.slice().reverse().filter((assessment) => typeof assessment.summary.probability === 'number').slice(-8).map((assessment) => ({
      value: assessment.summary.probability,
      label: new Date(assessment.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    }));
    doc.moveDown(0.5);
    drawLineChart(doc, chartPoints, `${label} model-derived probability trend`);
    note('The trend uses the assessment-level average of available classical model probabilities. It is not a clinical risk trajectory.');
    doc.moveDown(0.2);
    note('BioSync provides model-based decision support for research and assessment workflows. It is not a diagnosis and does not replace professional medical evaluation.');
    doc.end();
  });
}

router.get('/', async (req, res, next) => {
  try {
    const patients = await Patient.find({ owner: req.session.user.id }).sort({ createdAt: -1 });
    res.json(patients);
  } catch (error) { next(error); }
});

router.post('/', async (req, res, next) => {
  try {
    const body = { ...req.body, owner: req.session.user.id };
    const condition = body.condition || 'cardiovascular';
    if (!CONFIG[condition]) return res.status(400).json({ message: 'Unsupported assessment type' });

    const error = validatePatient(condition, body);
    if (error) return res.status(400).json({ message: error });

    if (req.session.user.role === 'patient') {
      body.name = req.session.user.name;
      body.patientId = body.patientId?.trim() || `P-${req.session.user.id.slice(-6).toUpperCase()}-${condition === 'diabetes' ? 'D' : 'C'}`;
    }

    if (condition === 'diabetes') {
      body.gender = undefined; body.height = undefined; body.weight = undefined;
      body.ap_hi = undefined; body.ap_lo = undefined; body.cholesterol = undefined;
      body.gluc = undefined; body.smoke = undefined; body.alco = undefined; body.active = undefined;
    } else {
      body.diabetesGender = undefined; body.hypertension = undefined; body.heart_disease = undefined;
      body.smoking_history = undefined; body.HbA1c_level = undefined; body.blood_glucose_level = undefined;
    }

    const patient = await Patient.create(body);
    res.status(201).json(patient);
  } catch (error) {
    if (error?.code === 11000 && error?.keyPattern?.owner && error?.keyPattern?.patientId) {
      return res.status(409).json({ message: `Patient ID ${error.keyValue?.patientId || ''} already exists for this account. Please use a different Patient ID.`.trim() });
    }
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const patient = await Patient.findOne({ _id: req.params.id, owner: req.session.user.id });
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    const predictions = await Prediction.find({ patient: patient._id, owner: req.session.user.id }).sort({ createdAt: -1 }).lean();
    const assessments = groupAssessments(predictions);
    const riskFactors = indicators(patient.condition, patient);

    if (req.session.user.role !== 'doctor') {
      return res.json({
        patient,
        predictions,
        assessments,
        viewerRole: 'patient',
        latest: assessments[0] || null,
        riskIndicators: riskFactors,
      });
    }

    res.json({
      patient,
      predictions,
      assessments,
      viewerRole: 'doctor',
      riskIndicators: riskFactors,
    });
  } catch (error) { next(error); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const patient = await Patient.findOne({ _id: req.params.id, owner: req.session.user.id });
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    const condition = patient.condition || 'cardiovascular';
    const body = { ...req.body };

    const error = validatePatient(condition, body);
    if (error) return res.status(400).json({ message: error });

    if (body.name && req.session.user.role === 'doctor') patient.name = body.name.trim();
    if (body.age !== undefined) patient.age = Number(body.age);

    if (condition === 'cardiovascular') {
      ['gender', 'height', 'weight', 'ap_hi', 'ap_lo', 'cholesterol', 'gluc', 'smoke', 'alco', 'active', 'bmi'].forEach((k) => {
        if (body[k] !== undefined) patient[k] = Number(body[k]);
      });
    } else {
      ['bmi', 'HbA1c_level', 'blood_glucose_level', 'hypertension', 'heart_disease'].forEach((k) => {
        if (body[k] !== undefined) patient[k] = Number(body[k]);
      });
      if (body.diabetesGender) patient.diabetesGender = body.diabetesGender;
      if (body.smoking_history) patient.smoking_history = body.smoking_history;
    }

    await patient.save();
    res.json({ ok: true, patient });
  } catch (error) { next(error); }
});

router.get('/:id/report', async (req, res, next) => {
  try {
    const patient = await Patient.findOne({ _id: req.params.id, owner: req.session.user.id });
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    const predictions = await Prediction.find({ patient: patient._id, owner: req.session.user.id }).sort({ createdAt: -1 }).lean();
    const assessments = groupAssessments(predictions);
    const latest = assessments[0] || null;

    let modelInfo = {};
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const response = await fetch(`${process.env.ML_API_URL || 'http://127.0.0.1:8000'}/models`, { signal: controller.signal });
      clearTimeout(timeout);
      if (response.ok) {
        const data = await response.json();
        modelInfo = data.conditions?.[patient.condition] || {};
      }
    } catch (_) { /* Report remains useful without live model metadata. */ }

    const pdf = await buildReport({
      patient,
      condition: patient.condition,
      assessments,
      latest,
      rows: latest ? modelRows(patient.condition, latest.items) : configFor(patient.condition).models.map((model) => ({ model, unavailable: true })),
      riskIndicators: indicators(patient.condition, patient),
      modelInfo,
    });

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="BioSync-${safeName(patient.patientId)}-${patient.condition}-analysis-report.pdf"`,
      'Content-Length': pdf.length,
    });
    res.send(pdf);
  } catch (error) { next(error); }
});

router.post('/:id/predict', async (req, res, next) => {
  try {
    const patient = await Patient.findOne({ _id: req.params.id, owner: req.session.user.id });
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    const condition = patient.condition || 'cardiovascular';
    const mlUrl = process.env.ML_API_URL || 'http://127.0.0.1:8000';
    const features = buildFeatures(condition, patient);
    const assessmentId = crypto.randomUUID();
    const results = [];
    const failures = [];

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 240000);
      const response = await fetch(`${mlUrl}/predict-all`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ condition, features }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.detail || 'Model service could not complete the assessment');
      for (const result of payload.results || []) results.push(result);
      for (const failure of payload.failures || []) failures.push(failure);
    } catch (error) {
      for (const model of configFor(condition).models) {
        if (results.some((result) => result.model === model)) continue;
        try {
          results.push(await runModel(mlUrl, condition, model, features));
        } catch (modelError) {
          failures.push({ model, message: modelError.message });
        }
      }
    }

    if (!results.length) {
      const detail = failures.length
        ? failures.map((failure) => `${failure.model}: ${failure.message}`).join(' | ')
        : 'The model service did not return any results.';
      return res.status(502).json({ message: `Assessment could not be completed. ${detail}`, failures });
    }

    const summary = summarize(condition, results);
    const riskFactors = indicators(condition, patient);
    const documents = results.map((data) => ({
      owner: patient.owner,
      patient: patient._id,
      assessmentId,
      condition,
      model: data.model,
      prediction: data.prediction,
      probability: data.probability,
      decisionScore: data.decision_score,
      assessmentProbability: summary.probability,
      riskLevel: summary.riskLevel,
      riskFactors,
      rawOutput: data,
    }));

    try {
      await Prediction.insertMany(documents, { ordered: true });
    } catch (insertError) {
      await Prediction.deleteMany({ owner: patient.owner, patient: patient._id, assessmentId }).catch(() => {});
      throw insertError;
    }

    if (req.session.user.role === 'patient') {
      const patientMessage = summary.riskLevel === 'high'
        ? 'The model-derived assessment indicates a higher-risk band. Please consult a healthcare professional for further evaluation.'
        : summary.riskLevel === 'moderate'
          ? 'The model-derived assessment indicates a moderate-risk band. We recommend discussing the result with a healthcare professional.'
          : 'The assessment has been processed. If you have concerns, discuss your result with a healthcare professional.';
      return res.status(201).json({
        assessmentId,
        condition,
        riskLevel: summary.riskLevel,
        patientMessage,
        modelsRun: results.length,
        failures: failures.length ? failures : undefined,
      });
    }

    res.status(201).json({ assessmentId, condition, summary, results, failures });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

module.exports = router;
