document.addEventListener('alpine:init', () => {
    Alpine.data('mriApp', () => ({
        isLoading: true,
        searchQuery: '',
        openGroups: [],
        openProtocols: [],
        openSequences: [],
        db: { groups: [], protocols: [], sequences: [], globals: [] },

        async initApp() {
            const data = await window.ApiService.fetchAllData();
            this.db = data;
            if (this.db.groups && this.db.groups.length > 0) {
                this.openGroups.push(String(this.db.groups[0].GroupID));
            }
            this.isLoading = false;
        },

        get filteredGroups() {
            if (!this.searchQuery.trim()) return this.db.groups;
            const q = this.searchQuery.toLowerCase().trim();
            return this.db.groups.filter(group => {
                if (String(group.GroupName).toLowerCase().includes(q)) return true;
                const protocols = this.getProtocolsForGroup(group.GroupID);
                return protocols.some(p =>
                    String(p.ProtocolName).toLowerCase().includes(q) ||
                    this.getSequencesForProtocol(p.ProtocolID).some(s => String(s.Name).toLowerCase().includes(q))
                );
            });
        },

        getProtocolsForGroup(groupId) {
            if (!this.db.protocols) return [];
            let protocols = this.db.protocols.filter(p => String(p.GroupID) === String(groupId));
            if (this.searchQuery.trim()) {
                const q = this.searchQuery.toLowerCase().trim();
                protocols = protocols.filter(p =>
                    String(p.ProtocolName).toLowerCase().includes(q) ||
                    this.getSequencesForProtocol(p.ProtocolID).some(s => String(s.Name).toLowerCase().includes(q))
                );
            }
            return protocols;
        },

        getSequencesForProtocol(protocolId) {
            if (!this.db.sequences) return [];
            return this.db.sequences
                .filter(s => String(s.ProtocolID) === String(protocolId))
                .sort((a, b) => Number(a.Order) - Number(b.Order));
        },

        toggleExpansion(type, id) {
            const idStr = String(id);
            const index = this[type].indexOf(idStr);
            if (index > -1) {
                this[type].splice(index, 1);
            } else {
                this[type].push(idStr);
                if (this[type].length > 3) this[type].shift();
            }
        },

        resolveParam(sequence, specificField, globalField) {
            if (sequence[specificField]) return sequence[specificField];
            if (!this.db.globals) return 'N/A';
            const seqName = String(sequence.Name).toUpperCase();
            const globalMatch = this.db.globals.find(g => seqName.includes(String(g.Keyword).toUpperCase()));
            if (globalMatch && globalMatch[globalField]) return `${globalMatch[globalField]} (Auto)`;
            return 'N/A';
        }
    }));
});