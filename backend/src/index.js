export default {
    async fetch(request, env) {
        const corsHeaders = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        };

        if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

        try {
            if (request.method === "GET") {
                const results = await env.DB.batch([
                    env.DB.prepare("SELECT * FROM Groups ORDER BY GroupOrder"),
                    env.DB.prepare("SELECT * FROM Protocols ORDER BY ProtocolOrder"),
                    env.DB.prepare("SELECT * FROM GlobalDefaults"),
                    env.DB.prepare("SELECT * FROM Sequences ORDER BY SeqOrder")
                ]);

                const groups = results[0].results;
                const protocols = results[1].results;
                const globals = results[2].results;
                const rawSequences = results[3].results;

                const sequences = rawSequences.map(s => {
                    let params = {};
                    try { params = JSON.parse(s.Parameters || '{}'); } catch (e) { }
                    return {
                        SeqID: s.SeqID, ProtocolID: s.ProtocolID, Order: s.SeqOrder,
                        Name: s.Name, PlanImageURL: s.PlanImageURL, Notes: s.Notes, ...params
                    };
                });

                return new Response(JSON.stringify({ status: 'success', data: { groups, protocols, sequences, globals } }),
                    { headers: { ...corsHeaders, "Content-Type": "application/json" } });
            }

            if (request.method === "POST") {
                const payload = await request.json();
                if (payload.action === 'updateSheet') {
                    const data = payload.data || [];
                    const statements = [];

                    if (payload.sheetName === 'Groups') {
                        statements.push(env.DB.prepare("DELETE FROM Groups"));
                        for (const row of data) {
                            statements.push(env.DB.prepare("INSERT INTO Groups (GroupID, GroupName, GroupOrder) VALUES (?, ?, ?)").bind(row.GroupID, row.GroupName, row.GroupOrder || 0));
                        }
                    } else if (payload.sheetName === 'Protocols') {
                        statements.push(env.DB.prepare("DELETE FROM Protocols"));
                        for (const row of data) {
                            statements.push(env.DB.prepare("INSERT INTO Protocols (ProtocolID, GroupID, ProtocolName, ProtocolOrder) VALUES (?, ?, ?, ?)").bind(row.ProtocolID, row.GroupID, row.ProtocolName, row.ProtocolOrder || 0));
                        }
                    } else if (payload.sheetName === 'Sequences') {
                        statements.push(env.DB.prepare("DELETE FROM Sequences"));
                        for (const row of data) {
                            const { SeqID, ProtocolID, Order, Name, PlanImageURL, Notes, ...restParams } = row;
                            statements.push(env.DB.prepare("INSERT INTO Sequences (SeqID, ProtocolID, SeqOrder, Name, PlanImageURL, Notes, Parameters) VALUES (?, ?, ?, ?, ?, ?, ?)").bind(SeqID, ProtocolID, Order, Name, PlanImageURL, Notes, JSON.stringify(restParams)));
                        }
                    }

                    if (statements.length > 0) await env.DB.batch(statements);
                    return new Response(JSON.stringify({ status: 'success' }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
                }
            }
        } catch (error) {
            return new Response(JSON.stringify({ status: 'error', message: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
    }
};