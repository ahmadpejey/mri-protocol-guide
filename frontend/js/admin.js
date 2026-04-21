document.addEventListener('alpine:init', () => {
    Alpine.data('adminApp', () => ({
        isLoading: true,
        isSaving: false,
        db: { groups: [], protocols: [], sequences: [] },
        selectedProtocolId: '',
        activeSequences: [],
        selectedRows: [],
        activeProtocolDetails: { Name: '', GroupID: '' },
        showModal: false,
        showManageGroupsModal: false,
        modalData: { name: '', groupId: '', newGroupName: '', protocolOrder: 1, groupOrder: 1 },

        async initAdmin() {
            const data = await window.ApiService.fetchAllData();
            this.db = data;
            if (!this.db.groups) this.db.groups = [];
            if (!this.db.protocols) this.db.protocols = [];
            if (!this.db.sequences) this.db.sequences = [];

            this.db.groups.sort((a, b) => Number(a.GroupOrder || 0) - Number(b.GroupOrder || 0));
            this.db.protocols.sort((a, b) => Number(a.ProtocolOrder || 0) - Number(b.ProtocolOrder || 0));
            this.isLoading = false;

            this.$watch('selectedProtocolId', (value) => {
                this.selectedRows = [];
                if (value) {
                    this.activeSequences = JSON.parse(JSON.stringify(
                        this.db.sequences.filter(s => String(s.ProtocolID) === String(value))
                    )).sort((a, b) => Number(a.Order) - Number(b.Order));
                    const proto = this.db.protocols.find(p => String(p.ProtocolID) === String(value));
                    this.activeProtocolDetails = { Name: proto.ProtocolName, GroupID: proto.GroupID };
                } else {
                    this.activeSequences = [];
                    this.activeProtocolDetails = { Name: '', GroupID: '' };
                }
            });
        },

        async updateProtocolDetails() {
            if (!this.selectedProtocolId) return;
            this.isSaving = true;
            const protoIndex = this.db.protocols.findIndex(p => String(p.ProtocolID) === String(this.selectedProtocolId));
            if (protoIndex > -1) {
                this.db.protocols[protoIndex].ProtocolName = this.activeProtocolDetails.Name;
                this.db.protocols[protoIndex].GroupID = this.activeProtocolDetails.GroupID;
                await window.ApiService.saveData('Protocols', this.db.protocols);
            }
            this.isSaving = false;
        },

        openManageGroups() { this.showManageGroupsModal = true; },
        closeManageGroups() { this.showManageGroupsModal = false; },

        async saveGroups() {
            this.isSaving = true;
            this.db.groups.sort((a, b) => Number(a.GroupOrder || 0) - Number(b.GroupOrder || 0));
            await window.ApiService.saveData('Groups', this.db.groups);
            this.isSaving = false;
            this.closeManageGroups();
        },

        addNewSequence() {
            const newSeqId = 'TMP_' + Math.floor(Math.random() * 1000000);
            this.activeSequences.push({
                SeqID: newSeqId, ProtocolID: String(this.selectedProtocolId), Order: this.activeSequences.length + 1,
                Name: 'NEW SEQUENCE', PlanImageURL: '', FOV: '', Thickness: '', Matrix: '', TR_Range: '', TE_Range: '', Notes: '',
                Flip: '', Phase: '', Gap: '', Average: ''
            });
        },

        moveSeqUp(index) {
            if (index === 0) return;
            const temp = this.activeSequences[index].Order;
            this.activeSequences[index].Order = this.activeSequences[index - 1].Order;
            this.activeSequences[index - 1].Order = temp;
            this.activeSequences.sort((a, b) => Number(a.Order) - Number(b.Order));
        },

        moveSeqDown(index) {
            if (index === this.activeSequences.length - 1) return;
            const temp = this.activeSequences[index].Order;
            this.activeSequences[index].Order = this.activeSequences[index + 1].Order;
            this.activeSequences[index + 1].Order = temp;
            this.activeSequences.sort((a, b) => Number(a.Order) - Number(b.Order));
        },

        toggleAll(event) {
            this.selectedRows = event.target.checked ? this.activeSequences.map(s => s.SeqID) : [];
        },

        deleteSelected() {
            if (this.selectedRows.length === 0) return;
            if (confirm(`Delete ${this.selectedRows.length} selected sequence(s)?`)) {
                this.activeSequences = this.activeSequences.filter(s => !this.selectedRows.includes(s.SeqID));
                this.selectedRows = [];
                this.activeSequences.forEach((seq, idx) => seq.Order = idx + 1);
            }
        },

        async saveSequences() {
            if (!this.selectedProtocolId) return;
            this.isSaving = true;
            this.db.sequences = this.db.sequences.filter(s => String(s.ProtocolID) !== String(this.selectedProtocolId));
            this.db.sequences = [...this.db.sequences, ...this.activeSequences];
            await window.ApiService.saveData('Sequences', this.db.sequences);
            this.isSaving = false;
        },

        openProtocolModal() {
            this.modalData = { name: '', groupId: '', newGroupName: '', protocolOrder: 1, groupOrder: 1 };
            this.showModal = true;
        },

        closeModal() { this.showModal = false; },

        async confirmAddProtocol() {
            if (!this.modalData.name) { alert("Protocol Name is required."); return; }
            if (!this.modalData.groupId) { alert("Please select or create a Group."); return; }

            this.isSaving = true;
            let finalGroupId = this.modalData.groupId;

            if (this.modalData.groupId === 'NEW_GROUP') {
                if (!this.modalData.newGroupName) { alert("New Group Name is required."); this.isSaving = false; return; }
                finalGroupId = 'G_' + Date.now();
                this.db.groups.push({ GroupID: finalGroupId, GroupName: this.modalData.newGroupName, GroupOrder: this.modalData.groupOrder });
                await window.ApiService.saveData('Groups', this.db.groups);
            }

            const newProtocolId = 'P_' + Date.now();
            this.db.protocols.push({ ProtocolID: newProtocolId, GroupID: finalGroupId, ProtocolName: this.modalData.name, ProtocolOrder: this.modalData.protocolOrder });
            await window.ApiService.saveData('Protocols', this.db.protocols);

            this.selectedProtocolId = newProtocolId;
            this.isSaving = false;
            this.closeModal();
        },

        async deleteProtocol() {
            if (!this.selectedProtocolId) return;
            const protocolName = this.db.protocols.find(p => String(p.ProtocolID) === String(this.selectedProtocolId)).ProtocolName;
            if (confirm(`CRITICAL WARNING: Delete '${protocolName}' AND all its sequences?`)) {
                this.isSaving = true;
                this.db.protocols = this.db.protocols.filter(p => String(p.ProtocolID) !== String(this.selectedProtocolId));
                this.db.sequences = this.db.sequences.filter(s => String(s.ProtocolID) !== String(this.selectedProtocolId));
                await window.ApiService.saveData('Protocols', this.db.protocols);
                await window.ApiService.saveData('Sequences', this.db.sequences);
                this.selectedProtocolId = '';
                this.activeSequences = [];
                this.isSaving = false;
            }
        }
    }));
});