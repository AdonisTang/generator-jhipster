/**
 * Copyright 2013-2020 the original author or authors from the JHipster project.
 *
 * This file is part of the JHipster project, see http://www.jhipster.tech/
 * for more information.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const _ = require('lodash');
const { UNIQUE, REQUIRED } = require('../../domain/jhipster/validations');
const { formatComment } = require('../../utils/format-utils');
const { camelCase } = require('../../utils/string-utils');

module.exports = {
    convert,
};

/**
 * Converts entity fields to JSON content.
 * @param {JDLObject} jdlObject - the JDL object containing entities, fields and enums.
 * @return {Map<String, Array<Object>>} a map having for keys an entity's name and for values its JSON fields.
 */
function convert(jdlObject) {
    if (!jdlObject) {
        throw new Error('A JDL Object must be passed to convert JDL fields to JSON.');
    }
    const convertedFields = new Map();
    jdlObject.forEachEntity(jdlEntity => {
        const convertedEntityFields = getConvertedFieldsForEntity(jdlEntity, jdlObject);
        convertedFields.set(jdlEntity.name, convertedEntityFields);
    });
    return convertedFields;
}

function getConvertedFieldsForEntity(jdlEntity, jdlObject) {
    const convertedEntityFields = [];
    jdlEntity.forEachField(jdlField => {
        let fieldData = {
            fieldName: camelCase(jdlField.name),
            fieldType: jdlField.type,
        };
        const comment = formatComment(jdlField.comment);
        if (comment) {
            fieldData.javadoc = comment;
        }
        if (jdlObject.hasEnum(jdlField.type)) {
            fieldData.fieldValues = jdlObject.getEnum(jdlField.type).getValuesAsString();
        }
        if (fieldData.fieldType && fieldData.fieldType.includes('Blob')) {
            const blobFieldData = getBlobFieldData(fieldData.fieldType);
            fieldData = {
                ...fieldData,
                ...blobFieldData,
            };
        }
        if (jdlField.validationQuantity() !== 0) {
            const fieldValidations = getFieldValidations(jdlField);
            fieldData = {
                ...fieldData,
                ...fieldValidations,
            };
        }
        if (jdlField.optionQuantity() !== 0) {
            const fieldOptions = getOptionsForField(jdlField);
            fieldData = {
                ...fieldData,
                ...fieldOptions,
            };
        }
        convertedEntityFields.push(fieldData);
    });
    return convertedEntityFields;
}

function getBlobFieldData(fieldType) {
    const blobFieldData = {
        fieldType: 'byte[]',
    };
    switch (fieldType) {
        case 'ImageBlob':
            blobFieldData.fieldTypeBlobContent = 'image';
            break;
        case 'Blob':
        case 'AnyBlob':
            blobFieldData.fieldTypeBlobContent = 'any';
            break;
        case 'TextBlob':
            blobFieldData.fieldTypeBlobContent = 'text';
            break;
        default:
            throw new Error(`Unrecognised Blob type: ${fieldType}.`);
    }
    return blobFieldData;
}

function getFieldValidations(jdlField) {
    const fieldValidations = {
        fieldValidateRules: [],
    };
    jdlField.forEachValidation(validation => {
        fieldValidations.fieldValidateRules.push(validation.name);
        if (validation.name !== REQUIRED && validation.name !== UNIQUE) {
            fieldValidations[`fieldValidateRules${_.capitalize(validation.name)}`] = validation.value;
        }
    });
    return fieldValidations;
}

function getOptionsForField(jdlField) {
    const fieldOptions = {
        options: {},
    };
    fieldOptions.options = {};
    jdlField.forEachOption(([key, value]) => {
        fieldOptions.options[key] = value;
    });
    return fieldOptions;
}
