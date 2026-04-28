# 🔥 Guia de Configuração do Firebase

## Passo 1: Criar Projeto Firebase

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Clique em **"Adicionar projeto"**
3. Digite o nome do projeto: `controle-inteligente`
4. Aceite os termos e clique em **"Criar projeto"**
5. Aguarde a criação

---

## Passo 2: Configurar Autenticação

1. No console Firebase, vá para **"Build"** → **"Authentication"**
2. Clique em **"Começar"**
3. Na aba **"Método de login"**, ative **"Email/Senha"**
   - Certifique-se de que a opção "Senha" está **habilitada**
4. Clique em **"Salvar"**

---

## Passo 3: Configurar Firestore Database

1. Vá para **"Build"** → **"Firestore Database"**
2. Clique em **"Criar banco de dados"**
3. Escolha a localização mais próxima (ex: Brasil - `southamerica-east1`)
4. Escolha modo de segurança: **"Modo de teste"** (para desenvolvimento)
   - **Importante:** Em produção, configure regras de segurança apropriadas!
5. Clique em **"Criar"**

### Regras de Firestore (Segurança)

Após criar o banco, vá para a aba **"Regras"** e substitua o conteúdo por:

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Usuários só podem ler/escrever seus próprios dados
    match /transactions/{doc=**} {
      allow read, write: if request.auth.uid == resource.data.userId;
      allow create: if request.auth.uid == request.resource.data.userId;
    }
    match /goals/{doc=**} {
      allow read, write: if request.auth.uid == resource.data.userId;
      allow create: if request.auth.uid == request.resource.data.userId;
    }
  }
}
```

Clique em **"Publicar"**

---

## Passo 4: Obter Credenciais

1. Vá para **"Project Settings"** (engrenagem no canto superior esquerdo)
2. Vá para a aba **"Seu apps"**
3. Clique em **"</>"** (Web)
4. Copie as credenciais mostradas

Você verá algo como:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "controle-inteligente.firebaseapp.com",
  projectId: "controle-inteligente",
  storageBucket: "controle-inteligente.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcd1234"
};
```

---

## Passo 5: Configurar Variáveis de Ambiente

1. Abra o arquivo `.env.local` na raiz do projeto
2. Substitua os valores pelos que você copiou:

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=controle-inteligente.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=controle-inteligente
VITE_FIREBASE_STORAGE_BUCKET=controle-inteligente.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcd1234
```

3. **Salve o arquivo**

---

## Passo 6: Iniciar o Aplicativo

```bash
npm run dev
```

Acesse `http://localhost:3000`

---

## 🎯 Como Usar

### Primeira Vez
1. Clique em **"Criar conta"**
2. Use um email válido (ex: `seu@email.com`)
3. Crie uma senha com 6+ caracteres
4. Clique em **"Criar Conta"**

### Próximas Vezes
1. Digite seu email
2. Digite sua senha
3. Clique em **"Entrar"**

---

## 📊 Estrutura de Dados no Firestore

### Coleção `transactions`
```
{
  id: "auto-gerado",
  userId: "uid-do-usuario",
  date: "2024-01-15",
  description: "Compra no supermercado",
  amount: 125.50,
  type: "Saída",
  category: "Necessidade",
  goalId: "opcional",
  createdAt: timestamp
}
```

### Coleção `goals`
```
{
  id: "auto-gerado",
  userId: "uid-do-usuario",
  name: "Viagem para Disney",
  targetAmount: 5000,
  currentAmount: 1200,
  deadline: "2024-12-31",
  createdAt: timestamp
}
```

---

## ✅ Próximos Passos

- ✅ Firebase configurado
- ✅ Autenticação funcionando
- ✅ Dados salvos na nuvem
- 🔜 Compartilhar dados com a equipe (opcional)
- 🔜 Deploy em produção

---

## 🆘 Troubleshooting

### Erro: "VITE_FIREBASE_API_KEY is undefined"
- Verifique se o arquivo `.env.local` existe
- Reinicie o servidor: `npm run dev`

### Erro: "Permission denied"
- Verifique as regras do Firestore
- Certifique-se de estar logado

### Dados não aparecem
- Verifique o Console do Firebase
- Confirme que `userId` está sendo salvo corretamente

---

**Dúvidas?** Consulte a [documentação oficial do Firebase](https://firebase.google.com/docs)
