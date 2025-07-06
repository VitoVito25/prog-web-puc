// Validação de senha em tempo real
class PasswordValidator {
    constructor() {
        this.requirements = {
            hasLetter: /[a-zA-Z]/,
            hasNumber: /\d/,
            hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};":\'\\|,.<>\/?]/,
            minLength: 6
        };
    }

    // Valida se a senha atende a todos os critérios
    validatePassword(password) {
        const validation = {
            hasLetter: this.requirements.hasLetter.test(password),
            hasNumber: this.requirements.hasNumber.test(password),
            hasSpecialChar: this.requirements.hasSpecialChar.test(password),
            hasMinLength: password.length >= this.requirements.minLength,
            isValid: false
        };

        // Senha é válida se atender a todos os critérios
        validation.isValid = validation.hasLetter && 
                           validation.hasNumber && 
                           validation.hasSpecialChar && 
                           validation.hasMinLength;

        return validation;
    }

    // Cria indicador visual de força da senha
    createPasswordStrengthIndicator(inputElement) {
        // Verifica se o indicador já existe para evitar duplicação
        if (inputElement.nextElementSibling && inputElement.nextElementSibling.classList.contains('password-strength-container')) {
            return inputElement.nextElementSibling;
        }

        const container = document.createElement('div');
        container.className = 'password-strength-container';
        container.innerHTML = `
            <div class="password-requirements">
                <div class="requirement" data-requirement="hasLetter">
                    <span class="requirement-icon">✗</span>
                    <span class="requirement-text">Pelo menos uma letra</span>
                </div>
                <div class="requirement" data-requirement="hasNumber">
                    <span class="requirement-icon">✗</span>
                    <span class="requirement-text">Pelo menos um número</span>
                </div>
                <div class="requirement" data-requirement="hasSpecialChar">
                    <span class="requirement-icon">✗</span>
                    <span class="requirement-text">Pelo menos um caractere especial (!@#$%^&*)</span>
                </div>
                <div class="requirement" data-requirement="hasMinLength">
                    <span class="requirement-icon">✗</span>
                    <span class="requirement-text">Mínimo de ${this.requirements.minLength} caracteres</span>
                </div>
            </div>
            <div class="password-strength-bar">
                <div class="strength-fill"></div>
            </div>
            <div class="password-strength-text">Força da senha: <span class="strength-level">Fraca</span></div>
        `;

        // Insere o indicador após o campo de senha
        inputElement.parentNode.insertBefore(container, inputElement.nextSibling);
        return container;
    }

    // Atualiza o indicador visual baseado na validação
    updatePasswordStrengthIndicator(container, validation, password) {
        const requirements = container.querySelectorAll('.requirement');
        const strengthFill = container.querySelector('.strength-fill');
        const strengthLevel = container.querySelector('.strength-level');

        let score = 0;
        const maxScore = 4;

        // Atualiza cada requisito
        requirements.forEach(req => {
            const requirement = req.dataset.requirement;
            const icon = req.querySelector('.requirement-icon');
            
            if (validation[requirement]) {
                req.classList.add('met');
                req.classList.remove('unmet');
                icon.textContent = '✓';
                score++;
            } else {
                req.classList.add('unmet');
                req.classList.remove('met');
                icon.textContent = '✗';
            }
        });

        // Atualiza barra de força
        const percentage = (score / maxScore) * 100;
        strengthFill.style.width = `${percentage}%`;

        // Atualiza texto e cor da força
        if (score === 0 || password.length === 0) {
            strengthLevel.textContent = 'Muito Fraca';
            strengthFill.className = 'strength-fill very-weak';
        } else if (score === 1) {
            strengthLevel.textContent = 'Fraca';
            strengthFill.className = 'strength-fill weak';
        } else if (score === 2) {
            strengthLevel.textContent = 'Regular';
            strengthFill.className = 'strength-fill fair';
        } else if (score === 3) {
            strengthLevel.textContent = 'Boa';
            strengthFill.className = 'strength-fill good';
        } else if (score === 4) {
            strengthLevel.textContent = 'Forte';
            strengthFill.className = 'strength-fill strong';
        }

        // Esconde o indicador se não há senha
        container.style.display = password.length > 0 ? 'block' : 'none';

        // Oculta/mostra a logo apenas na página de cadastro
        const logo = document.querySelector('.logo');
        if (logo && document.getElementById('registerForm')) {
            if (password.length > 0) {
                logo.style.display = 'none';
            } else {
                logo.style.display = 'block';
            }
        }
    }

    // Inicializa a validação para um campo de senha
    initializePasswordField(passwordFieldId) {
        const passwordField = document.getElementById(passwordFieldId);
        if (!passwordField) {
            console.error(`Campo de senha com ID '${passwordFieldId}' não encontrado`);
            return;
        }

        // Cria o indicador de força
        const strengthContainer = this.createPasswordStrengthIndicator(passwordField);

        // Adiciona listener para validação em tempo real
        passwordField.addEventListener('input', (e) => {
            const password = e.target.value;
            const validation = this.validatePassword(password);
            
            // Atualiza indicador visual
            this.updatePasswordStrengthIndicator(strengthContainer, validation, password);
            
            // Atualiza validade do campo HTML5
            if (validation.isValid) {
                passwordField.setCustomValidity('');
            } else {
                passwordField.setCustomValidity('A senha deve conter pelo menos uma letra, um número e um caractere especial');
            }
        });

        // Esconde inicialmente o indicador
        strengthContainer.style.display = 'none';

        // Oculta a logo ao focar no campo de senha na página de cadastro
        if (document.getElementById('registerForm')) {
            passwordField.addEventListener('focus', () => {
                const logo = document.querySelector('.logo');
                if (logo) {
                    logo.style.display = 'none';
                }
            });
            passwordField.addEventListener('blur', () => {
                const logo = document.querySelector('.logo');
                if (logo && passwordField.value.length === 0) {
                    logo.style.display = 'block';
                }
            });
        }
    }

    // Valida formulário antes do envio
    validateForm(formId) {
        const form = document.getElementById(formId);
        if (!form) {
            console.error(`Formulário com ID '${formId}' não encontrado`);
            return false;
        }

        const passwordField = form.querySelector('input[type="password"]');
        if (!passwordField) {
            console.error('Campo de senha não encontrado no formulário');
            return false;
        }

        const validation = this.validatePassword(passwordField.value);
        
        if (!validation.isValid) {
            alert('Por favor, certifique-se de que a senha atende a todos os requisitos de segurança.');
            passwordField.focus();
            return false;
        }

        return true;
    }
}

// Inicialização automática quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    const validator = new PasswordValidator();

    // Inicializa validação para o campo de senha do formulário de login (se existir)
    const loginPasswordField = document.querySelector('#userForm #password');
    if (loginPasswordField) {
        validator.initializePasswordField('password');
    }

    // Inicializa validação para o campo de senha do formulário de cadastro (se existir)
    const registerPasswordField = document.querySelector('#registerForm #password');
    if (registerPasswordField) {
        validator.initializePasswordField('password');
        
        // Adiciona validação no envio do formulário de cadastro
        document.getElementById('registerForm').addEventListener('submit', function(e) {
            if (!validator.validateForm('registerForm')) {
                e.preventDefault();
            }
        });
    }
});

// Exporta a classe para uso externo se necessário
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PasswordValidator;
}

