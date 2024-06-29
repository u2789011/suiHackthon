// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

/// Module for getting a set of Attributes from a "genes" vector.
/// Attaches its data via the dynamic field which can only be constructed
/// and read in this module.
module suifrens::genes {

    // === dependencies ===
    use std::string::{utf8, String};
    use sui::dynamic_field as df;
    use sui::bcs;


    // === Errors ===
    /// Trying to perform an action when not authorized.
    const ESelectorNotIncreased: u64 = 0;



    // === Structs ===

    /// Custom kry to store `GeneDefinations` at the target application.
    /// Rach Key is per `T` -one for each of the Suifrens.
    public struct GeneKey<phantom T> has copy, store, drop {}

    /// One of the possible values defines in GeneDefination.
    /// `seletor` field corresponds to the u8 value of the gene in a sequence.
    public struct Value has store, drop, copy {
        selector: u8,
        name: String
    }

    /// Holds the definations foe each gene. They are then assigned to
    /// Capys. Newborn will receice attributes available at the time.
    public struct GeneDefination has store, drop {
        name: String,
        values: vector<Value>
    }

    // === functions ===

    /// Set gene definations for an `app`, Parses raw definations via `definations_from_bcs`
    /// and attaches a vector of `GeneDefination` under the `GeneKey`
    /// 
    /// Can only be called once p[er UID
    public fun add_gene_definitions<T>(app: &mut UID, data: vector<u8>) {
        df::add(app, GeneKey<T> {}, definations_from_bcs(data))
    }


    /// Check whether gene definations have been set for the `app`
    public fun has_definations<T>(app: &UID): bool {
        df::exists_(app, GeneKey<T> {})
    }

    /// Get a vector of currently attached gene difinations.
    public fun definations<T>(app: &UID): &vector<GeneDefination> {
        df::borrow(app, GeneKey<T>{})
    }

    /// Get Capy attributes from the gene sequence.
    public fun get_attributes<T>(app: &UID, genes: &vector<u8>): vector<String> {
        let definations = definations<T>(app);
        let mut attributes = vector::empty();
        let(mut i, len) = (0u64, vector::length(definations));

        while (i <len ) {
            let gene_def = vector::borrow(definations, i);
            let capy_gene = vector::borrow(genes, i);

            let (mut j, num_options) = (0u64, vector::length(&gene_def.values));
            while (j < num_options) {
                let value = vector::borrow(&gene_def.values, j);
                if (*capy_gene <= value.selector) {
                    vector::push_back(&mut attributes, value.name);
                    break
                };
                j = j + 1;
            };
            i = i + 1;
        };
        attributes
    }

    /// a Funtion to deserizalize `GeneDefination`s from a vector,
    /// BCS format for the data is the  following:
    /// ```
    /// vector<{ name, values: vector< {selector, name} >}
    /// ```
    public fun definations_from_bcs(bytes: vector<u8>): vector<GeneDefination> {
        let mut bytes = bcs::new(bytes);
        let mut total = bcs::peel_vec_length(&mut bytes);
        let mut defs = vector::empty<GeneDefination>();

        // Iterate over the main vector of `GeneDefination`
        while (total > 0) {
            let name = utf8(bcs::peel_vec_u8(&mut bytes));
            let mut values = vector::empty<Value>();
            let mut val_len = bcs::peel_vec_length(&mut bytes);

            // Read each value separatly.
            let mut prev_selector: u8 = 0;
            while (val_len > 0) {
                let (selector, val_name) = (
                    bcs::peel_u8(&mut bytes),
                    utf8(bcs::peel_vec_u8(&mut bytes))
                );
                // Ensure that the selector is greater than `prev_selector`.
                assert!(prev_selector < selector, ESelectorNotIncreased);
                vector::push_back(&mut values, Value { selector, name: val_name});
                val_len = val_len - 1;
                prev_selector = selector;
            };

            vector::push_back(&mut defs, GeneDefination {name, values });
            total = total - 1;
        };
        
        defs

    }

    // === teste ===

    #[test]
    fun  test_bcs_and_back() {
        let values = get_init_genes();
        // BCS the original struct deserialize again
        let results = definations_from_bcs(bcs::to_bytes(&values));

        // Make sire the BCS is constructed correctly
        assert!(vector::borrow(&values, 0) == vector::borrow(&results, 0), 0);
        assert!(vector::borrow(&values, 1) == vector::borrow(&results, 1), 0);
    }

    #[test_only]
    public fun get_genes_for_testing(): vector<GeneDefination> {
        get_init_genes()
    }

    #[test_only]
    fun get_init_genes(): vector<GeneDefination> {
        let values = vector [
            GeneDefination {
                name: utf8(b"skin"),
                values: vector[
                    Value { name: utf8(b"basic"), selector: 178 },
                    Value { name: utf8(b"fox"), selector: 229}
                ]
            },
            GeneDefination {
                name: utf8(b"main"),
                values: vector[
                    Value { name: utf8(b"A87C4C"), selector: 25 },
                    Value { name: utf8(b"707070"), selector: 29 },
                    Value { name: utf8(b"F67B32"), selector: 51 },
                ]
            }
        ];
        values
    }

}