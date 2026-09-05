import sys
from main import DiabetesFeatures, diabetes_classical

sample = DiabetesFeatures(
    gender='Female', age=50, hypertension=0, heart_disease=0,
    smoking_history='never', bmi=25, HbA1c_level=5.5, blood_glucose_level=100
)
for model in ('LogisticRegression','RandomForest'):
    print(diabetes_classical(model, sample))
print('Diabetes classical smoke test: PASS')
