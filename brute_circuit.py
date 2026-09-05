import numpy as np, torch, pandas as pd, joblib, itertools, math
from pathlib import Path
from sklearn.metrics import roc_auc_score, accuracy_score, recall_score, confusion_matrix, f1_score
base=Path('/mnt/data/biosync_partner_work'); mdir=base/'ml-api/models/diabetes'
a=torch.load(mdir/'finetuned_hybrid_qml.pt',map_location='cpu',weights_only=False)
W=a['model_state_dict']['quantum_layer.weights'].detach().numpy(); W1=a['model_state_dict']['classical_head.0.weight'].detach().numpy(); b1=a['model_state_dict']['classical_head.0.bias'].detach().numpy(); W2=a['model_state_dict']['classical_head.3.weight'].detach().numpy(); b2=a['model_state_dict']['classical_head.3.bias'].detach().numpy(); thr=float(a['decision_threshold'])
test=pd.read_csv(base/'data/diabetes/evaluation/test_transformed.csv'); X=test[['age','bmi','HbA1c_level','blood_glucose_level']].values; y=test.diabetes.values
n=4; dim=16
I=np.eye(2,dtype=complex)
def rx(t):
 c=np.cos(t/2); s=np.sin(t/2); return np.array([[c,-1j*s],[-1j*s,c]],complex)
def ry(t):
 c=np.cos(t/2); s=np.sin(t/2); return np.array([[c,-s],[s,c]],complex)
def rz(t): return np.diag([np.exp(-1j*t/2),np.exp(1j*t/2)]).astype(complex)
gates={'X':rx,'Y':ry,'Z':rz}
def kron_wire(U,w):
 mats=[U if i==w else I for i in range(n)]
 out=mats[0]
 for m in mats[1:]: out=np.kron(out,m)
 return out
def cnot(c,t):
 M=np.zeros((dim,dim),complex)
 for idx in range(dim):
  bits=[(idx>>(n-1-k))&1 for k in range(n)]
  if bits[c]: bits[t]^=1
  j=0
  for b in bits:j=(j<<1)|b
  M[j,idx]=1
 return M
cnots={p:cnot(*p) for p in [(i,i+1) for i in range(3)]+[(i+1,i) for i in range(3)]+[(3,0)]}
Zops={}
for w in range(n): Zops[w]=kron_wire(np.array([[1,0],[0,-1]],complex),w)
Xops={}; Yops={}
for w in range(n):
 Xops[w]=kron_wire(np.array([[0,1],[1,0]],complex),w); Yops[w]=kron_wire(np.array([[0,-1j],[1j,0]],complex),w)

def train_U(g1,g2,order,ent):
 U=np.eye(dim,dtype=complex)
 pairs = [(0,1),(1,2),(2,3)] if ent=='forward' else ([(1,0),(2,1),(3,2)] if ent=='reverse' else [(0,1),(1,2),(2,3),(3,0)])
 for l in range(W.shape[0]):
  if order=='gates_then_ent':
   for w in range(n):
    U=kron_wire(gates[g1](W[l,w,0]),w)@U
    U=kron_wire(gates[g2](W[l,w,1]),w)@U
   for p in pairs: U=cnots.get(p,cnot(*p))@U
  elif order=='ent_then_gates':
   for p in pairs: U=cnots.get(p,cnot(*p))@U
   for w in range(n):
    U=kron_wire(gates[g1](W[l,w,0]),w)@U
    U=kron_wire(gates[g2](W[l,w,1]),w)@U
 return U

def input_state(x,g):
 st=np.array([1+0j])
 for v in x: st=np.kron(st,gates[g](v)@np.array([1,0],complex))
 return st
results=[]
for emb in ['X','Y','Z']:
 states=np.stack([input_state(x,emb) for x in X],axis=0)
 for g1 in ['X','Y','Z']:
  for g2 in ['X','Y','Z']:
   for order in ['gates_then_ent','ent_then_gates']:
    for ent in ['forward','reverse','ring']:
     U=train_U(g1,g2,order,ent)
     out=states@U.T
     for meas_name,ops in [('Z',Zops),('X',Xops),('Y',Yops)]:
      q=np.zeros((len(X),n))
      for w in range(n):
       q[:,w]=np.real(np.einsum('bi,ij,bj->b',out.conj(),ops[w],out))
      h=np.maximum(0,q@W1.T+b1)
      logits=(h@W2.T+b2).reshape(-1); probs=1/(1+np.exp(-logits)); pred=(probs>=thr).astype(int)
      auc=roc_auc_score(y,probs); acc=accuracy_score(y,pred); sens=recall_score(y,pred); tn,fp,fn,tp=confusion_matrix(y,pred).ravel(); spec=tn/(tn+fp); f1=f1_score(y,pred)
      score=abs(auc-0.881722918675667)+abs(acc-0.828)+abs(sens-0.7764705882352941)+abs(spec-0.8327868852459016)+abs(f1-0.4342105263157895)
      results.append((score,auc,acc,sens,spec,f1,emb,g1,g2,order,ent,meas_name,(tn,fp,fn,tp)))
results.sort(key=lambda x:x[0])
for r in results[:30]:print(r)
