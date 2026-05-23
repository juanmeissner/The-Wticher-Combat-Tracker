let skills = [];

let selectedSkillId = null;

let skillLongPressTimer = null;

let wasSkillLongPress = false;

function saveSkills() {

    localStorage.setItem(
        'skills',
        JSON.stringify(skills)
    );
}

function loadSkills() {

    const saved =
        localStorage.getItem('skills');

    if (!saved) return;

    skills = JSON.parse(saved);
}

function renderSkills() {

    const container =
        document.getElementById('skillsList');

    if (!container) return;

    container.innerHTML = '';

    if (skills.length === 0) {

        container.innerHTML = `
            <div class="text-center text-slate-500 mt-10">

                Nenhuma habilidade

            </div>
        `;

        return;
    }

    skills.forEach(skill => {

        container.innerHTML += `

        <div

            ontouchstart="startSkillLongPress('${skill.id}')"

            ontouchend="handleSkillTouchEnd('${skill.id}')"

            class="inventory-card cursor-pointer

            ${selectedSkillId === skill.id
                ? 'ring-2 ring-cyan-400'
                : ''}">

            <div class="flex items-center gap-3">

                ${renderIcon(skill.icon)}

                <div class="text-lg font-bold">

                    ${skill.name}

                </div>

            </div>

        </div>
        `;
    });
}

function startSkillLongPress(skillId) {

    wasSkillLongPress = false;

    skillLongPressTimer = setTimeout(() => {

        wasSkillLongPress = true;

        showSkillDetails(skillId);

    }, 500);
}

function cancelSkillLongPress() {

    clearTimeout(skillLongPressTimer);
}

function handleSkillTouchEnd(skillId) {

    cancelSkillLongPress();

    if (wasSkillLongPress) return;

    selectSkill(skillId);
}

function selectSkill(skillId) {

    selectedSkillId = skillId;

    renderSkills();
}

function showSkillDetails(skillId) {

    const skill =
        skills.find(s => s.id === skillId);

    if (!skill) return;

    const content =
        document.getElementById(
            'skillDetailsContent'
        );

    content.innerHTML = `

        <div class="text-3xl mb-3">

            ${renderIcon(skill.icon)}

        </div>

        <div class="text-2xl font-bold mb-3">

            ${skill.name}

        </div>

        <div class="text-cyan-400 mb-4">

            ?? ${skill.cost} ST

        </div>

        <div class="text-slate-300">

            ${skill.description}

        </div>
    `;

    document
        .getElementById('skillDetailsModal')
        .classList.remove('hidden');
}

function closeSkillDetailsModal() {

    document
        .getElementById('skillDetailsModal')
        .classList.add('hidden');
}

function addSkill(skillId) {

    const exists =
        skills.find(s => s.id === skillId);

    if (exists) return;

    const base =
        predefinedSkills.find(
            s => s.id === skillId
        );

    if (!base) return;

    skills.push(base);

    saveSkills();

    renderSkills();

    showToast(
        `? ${base.name} aprendida!`
    );
}

function removeSelectedSkill() {

    if (!selectedSkillId) return;

    skills =
        skills.filter(
            s => s.id !== selectedSkillId
        );

    selectedSkillId = null;

    saveSkills();

    renderSkills();
}

function openSkillsModal() {

    document
        .getElementById('skillsModal')
        .classList.remove('hidden');

    renderSkillsModal();
}

function closeSkillsModal() {

    document
        .getElementById('skillsModal')
        .classList.add('hidden');
}

function renderSkillsModal() {

    const container =
        document.getElementById(
            'skillsItemsList'
        );

    container.innerHTML = '';

    predefinedSkills.forEach(skill => {

        container.innerHTML += `

        <button

            onclick="addSkill('${skill.id}')"

            class="w-full
                   bg-slate-800
                   hover:bg-slate-700
                   rounded-xl
                   p-4
                   flex
                   justify-between
                   items-center">

            <div class="flex items-center gap-3">

                ${renderIcon(skill.icon)}

                <div class="font-bold">

                    ${skill.name}

                </div>

            </div>

            <span class="text-cyan-400">

                Adicionar

            </span>

        </button>
        `;
    });
}

window.addEventListener('load', () => {

    loadSkills();

    renderSkills();

    const btn =
        document.getElementById(
            'openSkillsModalBtn'
        );

    if (btn) {

        btn.addEventListener(
            'click',
            openSkillsModal
        );
    }
});

