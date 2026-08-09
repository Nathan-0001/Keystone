// Current Work - renders projects from data/current-work.json
(function () {
    const workList = document.getElementById('work-list');
    if (!workList) return;

    const DATA_URL = 'data/current-work.json?v=' + Date.now();

    function escapeHtml(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function buildCard(project, index) {
        const card = document.createElement('article');
        card.className = 'work-card' + (index % 2 === 1 ? ' work-card--flipped' : '');

        const mapEmbed = project.mapEmbed ? escapeHtml(project.mapEmbed) : '';

        const cardInner = document.createElement('div');
        cardInner.className = 'work-card__inner';

        const media = document.createElement('div');
        media.className = 'work-card__media';
        if (mapEmbed) {
            media.innerHTML = '<iframe class="work-card__map-frame" src="' + mapEmbed + '" title="Map of ' + escapeHtml(project.location) + '" loading="lazy" allowfullscreen referrerpolicy="no-referrer-when-downgrade"></iframe>';
        } else {
            media.innerHTML = '<div class="work-card__placeholder">No map yet</div>';
        }

        const body = document.createElement('div');
        body.className = 'work-card__body';

        let datesHtml = '';
        if (project.startDate || project.endDate) {
            datesHtml = '<p class="work-card__dates">' + escapeHtml(project.startDate || 'TBC') + ' &ndash; ' + escapeHtml(project.endDate || 'Present') + '</p>';
        }

        body.innerHTML =
            '<h2 class="work-card__title">' + escapeHtml(project.location) + '</h2>' +
            (project.subheading ? '<h3 class="work-card__subheading">' + escapeHtml(project.subheading) + '</h3>' : '') +
            datesHtml +
            (project.description ? '<p class="work-card__description">' + escapeHtml(project.description) + '</p>' : '');

        cardInner.appendChild(media);
        cardInner.appendChild(body);
        card.appendChild(cardInner);
        return card;
    }

    async function render() {
        workList.innerHTML = '';
        try {
            const res = await fetch(DATA_URL);
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const data = await res.json();
            const projects = Array.isArray(data.projects) ? data.projects : [];

            if (!projects.length) {
                const empty = document.createElement('p');
                empty.className = 'work-empty';
                empty.textContent = 'No current projects to show yet. Check back soon!';
                workList.appendChild(empty);
                return;
            }

            projects.forEach((project, index) => {
                workList.appendChild(buildCard(project, index));
            });
        } catch (err) {
            console.error('Failed to load current work:', err);
            const empty = document.createElement('p');
            empty.className = 'work-empty';
            empty.textContent = 'Unable to load current projects right now. Please try again later.';
            workList.appendChild(empty);
        }
    }

    render();
})();
