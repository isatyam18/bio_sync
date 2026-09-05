import numpy as np, torch, pandas as pd, joblib
from pathlib import Path
from sklearn.metrics import accuracy_score, balanced_accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix
base=Path('/mnt/data/biosync_partner_work')
mdir=base/'ml-api/models/diabetes'
a=torch.load(mdir/'finetuned_hybrid_qml.pt',map_location='cpu',weights_only=False)
W=a['model_state_dict']['quantum_layer.weights'].detach().numpy()
W1=a['model_state_dict']['classical_head.0.weight'].detach().numpy(); b1=a['model_state_dict']['classical_head.0.bias'].detach().numpy()
W2=a['model_state_dict']['classical_head.3.weight'].detach().numpy(); b2=a['model_state_dict']['classical_head.3.bias'].detach().numpy()
sc=joblib.load(mdir/'scaler.pkl'); qsc=joblib.load(mdir/'quantum_scaler.pkl')
test=pd.read_csv(base/'data/diabetes/evaluation/test_transformed.csv'); y=test.diabetes.values
# current qml runtime starts from raw numeric, standardizes using scaler, then qsc; equivalently qsc.transform(Xrawstd)
cols=['age','bmi','HbA1c_level','blood_glucose_level']
Xstd=test[cols].values
angles=qsc.transform(Xstd)
# matrices
I=np.eye(2,dtype=np.complex128); Y=np.array([[0,-1j],[1j,0]],complex); Z=np.array([[1,0],[0,-1]],complex)
def RY(t):
 c=np.cos(t/2); s=np.sin(t/2); return np.array([[c,-s],[s,c]],complex)
def RZ(t):
 return np.array([[np.exp(-1j*t/2),0],[0,np.exp(1j*t/2)]],complex)
def apply_single(state,U,w,n=4):
 # tensor order wire 0..n-1 as axes; reshape state to n axes
 a=state.reshape([2]*n)
 # move wire to front
 a=np.moveaxis(a,w,0).reshape(2,-1)
 a=U@a
 a=np.moveaxis(a.reshape([2]+[2]*(n-1)),0,w)
 return a.reshape(-1)
def apply_cnot(state,c,t,n=4):
 # axis ordering wires 0..n-1
 a=state.reshape([2]*n)
 # explicit basis permutation
 out=np.zeros_like(state)
 for idx in range(2**n):
  bits=[(idx>>(n-1-k))&1 for k in range(n)]
  if bits[c]: bits[t]^=1
  j=0
  for bit in bits: j=(j<<1)|bit
  out[j]=state[idx]
 return out

def run_one(x, embedding='RY', order='RYRZ'):
 st=np.zeros(16,complex); st[0]=1
 for w,xv in enumerate(x): st=apply_single(st,RY(xv) if embedding=='RY' else (RZ(xv) if embedding=='RZ' else np.array([[np.cos(xv/2),-1j*np.sin(xv/2)],[-1j*np.sin(xv/2),np.cos(xv/2)]],complex)),w)
 for l in range(W.shape[0]):
  for w in range(4):
   if order=='RYRZ':
    st=apply_single(st,RY(W[l,w,0]),w); st=apply_single(st,RZ(W[l,w,1]),w)
   elif order=='RZR Y':
    st=apply_single(st,RZ(W[l,w,0]),w); st=apply_single(st,RY(W[l,w,1]),w)
  for w in range(3): st=apply_cnot(st,w,w+1)
 ex=[]
 for w in range(4):
  # expectation z on wire w
  s=0
  for idx,amp in enumerate(st):
   bit=(idx>>(3-w))&1
   s += (1 if bit==0 else -1)*abs(amp)**2
  ex.append(s.real)
 return np.array(ex)
for emb in ['RY','RX']:
 probs=[]
 for x in angles:
  q=run_one(x, embedding=emb)
  hidden=np.maximum(0,W1@q+b1)
  logit=float((W2@hidden+b2).reshape(-1)[0])
  probs.append(1/(1+np.exp(-logit)))
 probs=np.array(probs)
 pred=(probs>=float(a['decision_threshold'])).astype(int)
 tn,fp,fn,tp=confusion_matrix(y,pred).ravel()
 print(emb, 'metrics',accuracy_score(y,pred),recall_score(y,pred),tn/(tn+fp),f1_score(y,pred),roc_auc_score(y,probs),'cm',(tn,fp,fn,tp),'range',probs.min(),probs.max())
