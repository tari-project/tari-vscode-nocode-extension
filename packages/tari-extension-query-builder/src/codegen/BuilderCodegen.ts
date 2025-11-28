import {
  AddInstructionDescription,
  AllocateComponentAddress,
  AllocateResourceAddress,
  ArgValue,
  CallFunctionDescription,
  CallMethodDescription,
  FeeTransactionPayFromComponentDescription,
  InputParameter,
  SaveVarDescription,
  TransactionContext,
  TransactionDetails,
} from "@/execute/types";
import { Type } from "@tari-project/typescript-bindings";
import * as ts from "typescript";

const factory = ts.factory;
const syntaxKindValues = Object.values(ts.SyntaxKind).filter((value) => typeof value === "number") as number[];

export class BuilderCodegen {
  constructor(private readonly details: TransactionDetails) {}

  public generateTypescriptCode(): string {
    return this.generateCode(ts.ScriptKind.TS);
  }

  public generateJavascriptCode(): string {
    const code = this.generateCode(ts.ScriptKind.TS);

    const javascript = ts.transpileModule(code, {
      compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
    });
    return javascript.outputText;
  }

  private generateCode(kind: ts.ScriptKind): string {
    const filename = kind === ts.ScriptKind.TS ? "transaction.ts" : "transaction.js";
    const file = ts.createSourceFile(filename, "", ts.ScriptTarget.ES2022, false, kind);
    const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
    const result = printer.printList(ts.ListFormat.MultiLine, this.buildAst(), file);
    return stripEmptyComments(result);
  }

  private buildAst(): ts.NodeArray<ts.Statement> {
    return factory.createNodeArray([
      factory.createImportDeclaration(
        undefined,
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        factory.createImportClause(
          false,
          undefined,
          factory.createNamedImports([
            factory.createImportSpecifier(false, undefined, factory.createIdentifier("Amount")),
            factory.createImportSpecifier(false, undefined, factory.createIdentifier("buildTransactionRequest")),
            factory.createImportSpecifier(false, undefined, factory.createIdentifier("Network")),
            factory.createImportSpecifier(false, undefined, factory.createIdentifier("submitAndWaitForTransaction")),
            factory.createImportSpecifier(false, undefined, factory.createIdentifier("TariSigner")),
            factory.createImportSpecifier(false, undefined, factory.createIdentifier("TransactionBuilder")),
          ]),
        ),
        factory.createStringLiteral("@tari-project/tarijs-all"),
        undefined,
      ),
      factory.createImportDeclaration(
        undefined,
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        factory.createImportClause(
          false,
          undefined,
          factory.createNamedImports([
            factory.createImportSpecifier(false, undefined, factory.createIdentifier("TransactionResult")),
            factory.createImportSpecifier(false, undefined, factory.createIdentifier("UnsignedTransactionV1")),
          ]),
        ),
        factory.createStringLiteral("@tari-project/typescript-bindings"),
        undefined,
      ),
      ...addEmptyCommentToFirstNode(buildInterfaces(this.details.context)),
      ...addEmptyCommentToFirstNode(buildInputVariables(this.details.context)),
      addEmptyComment(
        factory.createFunctionDeclaration(
          undefined,
          undefined,
          factory.createIdentifier("buildTransaction"),
          undefined,
          [
            factory.createParameterDeclaration(
              undefined,
              undefined,
              factory.createIdentifier("network"),
              undefined,
              factory.createTypeReferenceNode(factory.createIdentifier("Network"), undefined),
              undefined,
            ),
            ...buildInputArgs(this.details.context),
          ],
          factory.createTypeReferenceNode(factory.createIdentifier("UnsignedTransactionV1"), undefined),
          factory.createBlock(
            [
              factory.createVariableStatement(
                undefined,
                factory.createVariableDeclarationList(
                  [
                    factory.createVariableDeclaration(
                      factory.createIdentifier("builder"),
                      undefined,
                      undefined,
                      factory.createNewExpression(factory.createIdentifier("TransactionBuilder"), undefined, [
                        factory.createIdentifier("network"),
                      ]),
                    ),
                  ],
                  ts.NodeFlags.Const,
                ),
              ),
              ...this.createStatements(),
              factory.createReturnStatement(
                factory.createCallExpression(
                  factory.createPropertyAccessExpression(
                    factory.createIdentifier("builder"),
                    factory.createIdentifier("buildUnsignedTransaction"),
                  ),
                  undefined,
                  [],
                ),
              ),
            ],
            true,
          ),
        ),
      ),
      addEmptyComment(
        factory.createFunctionDeclaration(
          [factory.createToken(ts.SyntaxKind.ExportKeyword), factory.createToken(ts.SyntaxKind.AsyncKeyword)],
          undefined,
          factory.createIdentifier("executeTransaction"),
          undefined,
          [
            factory.createParameterDeclaration(
              undefined,
              undefined,
              factory.createIdentifier("signer"),
              undefined,
              factory.createTypeReferenceNode(factory.createIdentifier("TariSigner"), undefined),
              undefined,
            ),
            factory.createParameterDeclaration(
              undefined,
              undefined,
              factory.createIdentifier("network"),
              undefined,
              factory.createTypeReferenceNode(factory.createIdentifier("Network"), undefined),
              undefined,
            ),
            factory.createParameterDeclaration(
              undefined,
              undefined,
              factory.createIdentifier("accountId"),
              undefined,
              factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword),
              undefined,
            ),
            ...buildInputArgs(this.details.context),
          ],
          factory.createTypeReferenceNode(factory.createIdentifier("Promise"), [
            factory.createTypeReferenceNode(factory.createIdentifier("TransactionResult"), undefined),
          ]),
          factory.createBlock(
            [
              factory.createVariableStatement(
                undefined,
                factory.createVariableDeclarationList(
                  [
                    factory.createVariableDeclaration(
                      factory.createIdentifier("submitTransactionRequest"),
                      undefined,
                      undefined,
                      factory.createCallExpression(factory.createIdentifier("buildTransactionRequest"), undefined, [
                        factory.createCallExpression(factory.createIdentifier("buildTransaction"), undefined, [
                          factory.createIdentifier("network"),
                          ...Object.keys(this.details.context.inputParams).map((key) => factory.createIdentifier(key)),
                        ]),
                        factory.createIdentifier("accountId"),
                      ]),
                    ),
                  ],
                  ts.NodeFlags.Const,
                ),
              ),
              factory.createVariableStatement(
                undefined,
                factory.createVariableDeclarationList(
                  [
                    factory.createVariableDeclaration(
                      factory.createIdentifier("txResult"),
                      undefined,
                      undefined,
                      factory.createAwaitExpression(
                        factory.createCallExpression(
                          factory.createIdentifier("submitAndWaitForTransaction"),
                          undefined,
                          [factory.createIdentifier("signer"), factory.createIdentifier("submitTransactionRequest")],
                        ),
                      ),
                    ),
                  ],
                  ts.NodeFlags.Const,
                ),
              ),
              factory.createReturnStatement(
                factory.createPropertyAccessExpression(
                  factory.createPropertyAccessExpression(
                    factory.createIdentifier("txResult"),
                    factory.createIdentifier("result"),
                  ),
                  factory.createIdentifier("result"),
                ),
              ),
            ],
            true,
          ),
        ),
      ),
    ]);
  }

  private createStatements(): ts.NodeArray<ts.Statement> {
    const factory = ts.factory;
    return factory.createNodeArray(
      this.details.descriptions.map((description) => {
        switch (description.type) {
          case "feeTransactionPayFromComponent":
            return this.createFeeTransactionPayFromComponent(description);
          case "callMethod":
            return this.createCallMethod(description);
          case "callFunction":
            return this.createCallFunction(description);
          case "addInstruction":
            return this.createAddInstruction(description);
          case "saveVar":
            return this.createSaveVar(description);
          case "allocateComponentAddress":
            return this.createAllocateComponentAddress(description);
          case "allocateResourceAddress":
            return this.createAllocateResourceAddress(description);
        }
      }),
    );
  }

  private createFeeTransactionPayFromComponent(description: FeeTransactionPayFromComponentDescription): ts.Statement {
    return factory.createExpressionStatement(
      factory.createCallExpression(
        factory.createPropertyAccessExpression(
          factory.createIdentifier("builder"),
          factory.createIdentifier("feeTransactionPayFromComponent"),
        ),
        undefined,
        [
          factory.createStringLiteral(description.args[0]),
          factory.createCallExpression(
            factory.createPropertyAccessExpression(factory.createIdentifier("Amount"), factory.createIdentifier("of")),
            undefined,
            [factory.createNumericLiteral(Number(description.args[1]))],
          ),
        ],
      ),
    );
  }

  private createArgValueAst(arg: ArgValue): ts.Expression {
    switch (arg.type) {
      case "workspace":
        // Use { Workspace: "name" } instead of fromWorkspace()
        return factory.createObjectLiteralExpression(
          [
            factory.createPropertyAssignment(
              factory.createIdentifier("Workspace"),
              factory.createStringLiteral(arg.value),
            ),
          ],
          false,
        );
      case "input":
        return factory.createPropertyAccessExpression(
          factory.createIdentifier(arg.reference.name),
          factory.createIdentifier(arg.reference.inputParam.name),
        );
      default:
        return transformObjectToAstArray(arg.value)[0];
    }
  }

  private createArgValuesAst(args: ArgValue[]): ts.Expression {
    const expressions = args.map((arg) => this.createArgValueAst(arg));
    return factory.createArrayLiteralExpression(expressions, false);
  }

  private createCallMethod(description: CallMethodDescription): ts.Statement {
    const objExpression = factory.createObjectLiteralExpression(
      [
        factory.createPropertyAssignment(
          factory.createIdentifier("componentAddress"),
          this.createArgValueAst(description.componentAddress),
        ),
        factory.createPropertyAssignment(
          factory.createIdentifier("methodName"),
          transformObjectToAstArray(description.methodName)[0],
        ),
      ],
      true,
    );
    return factory.createExpressionStatement(
      factory.createCallExpression(
        factory.createPropertyAccessExpression(
          factory.createIdentifier("builder"),
          factory.createIdentifier("callMethod"),
        ),
        undefined,
        [objExpression, this.createArgValuesAst(description.args)],
      ),
    );
  }

  private createCallFunction(description: CallFunctionDescription): ts.Statement {
    return factory.createExpressionStatement(
      factory.createCallExpression(
        factory.createPropertyAccessExpression(
          factory.createIdentifier("builder"),
          factory.createIdentifier("callFunction"),
        ),
        undefined,
        [transformObjectToAstArray(description.function)[0], this.createArgValuesAst(description.args)],
      ),
    );
  }

  private createAddInstruction(description: AddInstructionDescription): ts.Statement {
    if (description.name !== "EmitLog") {
      throw new Error(`Unknown instruction: ${description.name}`);
    }
    const getArg = (idx: number) => {
      const arg = description.args[idx];
      return arg.type === "input"
        ? factory.createPropertyAccessExpression(
            factory.createIdentifier(arg.reference.name),
            factory.createIdentifier(arg.reference.inputParam.name),
          )
        : description.args[idx].value;
    };

    const call = {
      [description.name]: {
        level: getArg(0),
        message: getArg(1),
      },
    };

    return factory.createExpressionStatement(
      factory.createCallExpression(
        factory.createPropertyAccessExpression(
          factory.createIdentifier("builder"),
          factory.createIdentifier("addInstruction"),
        ),
        undefined,
        transformObjectToAstArray(call),
      ),
    );
  }

  private createSaveVar(description: SaveVarDescription): ts.Statement {
    return factory.createExpressionStatement(
      factory.createCallExpression(
        factory.createPropertyAccessExpression(
          factory.createIdentifier("builder"),
          factory.createIdentifier("saveVar"),
        ),
        undefined,
        [factory.createStringLiteral(description.key)],
      ),
    );
  }

  private createAllocateComponentAddress(description: AllocateComponentAddress): ts.Statement {
    return factory.createExpressionStatement(
      factory.createCallExpression(
        factory.createPropertyAccessExpression(
          factory.createIdentifier("builder"),
          factory.createIdentifier("allocateAddress"),
        ),
        undefined,
        [factory.createStringLiteral("Component"), factory.createStringLiteral(description.workspaceId)],
      ),
    );
  }

  private createAllocateResourceAddress(description: AllocateResourceAddress): ts.Statement {
    return factory.createExpressionStatement(
      factory.createCallExpression(
        factory.createPropertyAccessExpression(
          factory.createIdentifier("builder"),
          factory.createIdentifier("allocateAddress"),
        ),
        undefined,
        [factory.createStringLiteral("Resource"), factory.createStringLiteral(description.workspaceId)],
      ),
    );
  }
}

function transformObjectToAst(obj: unknown): ts.Expression | ts.Expression[] {
  if (Array.isArray(obj)) {
    return obj.map((item) => transformObjectToAst(item) as ts.Expression);
  }

  if (typeof obj === "object" && obj !== null) {
    if (isTypescriptASTNode(obj)) {
      return obj;
    }
    const properties = Object.entries(obj).map(([key, value]) =>
      factory.createPropertyAssignment(factory.createIdentifier(key), transformObjectToAst(value) as ts.Expression),
    );
    return factory.createObjectLiteralExpression(properties, true);
  } else if (typeof obj === "string") {
    return factory.createStringLiteral(obj);
  } else if (typeof obj === "number") {
    return factory.createNumericLiteral(obj);
  } else if (typeof obj === "boolean") {
    return obj ? factory.createTrue() : factory.createFalse();
  } else if (obj === null) {
    return factory.createNull();
  } else if (obj === undefined) {
    return factory.createIdentifier("undefined");
  } else {
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    return factory.createIdentifier(String(obj));
  }
}

function transformObjectToAstArray(obj: unknown): ts.Expression[] {
  const expressions = transformObjectToAst(obj);
  return Array.isArray(expressions) ? expressions : [expressions];
}

function addEmptyComment<T extends ts.Node>(node: T): T {
  return ts.addSyntheticLeadingComment(node, ts.SyntaxKind.SingleLineCommentTrivia, "", true);
}

function addEmptyCommentToFirstNode<T extends ts.Node>(nodes: T[]) {
  const [firstNode, ...otherNodes] = nodes;
  return [addEmptyComment(firstNode), ...otherNodes];
}

function stripEmptyComments(code: string): string {
  return code
    .split("\n")
    .map((line) => (/^\s*\/\/\s*$/.test(line) ? "" : line))
    .join("\n");
}

function getInterfaceName(name: string) {
  if (!name.length) {
    throw new Error("Empty interface name");
  }
  const capitalized = name[0].toUpperCase() + name.substring(1);
  return `${capitalized}Props`;
}

function buildInterface(name: string, params: InputParameter[]): ts.InterfaceDeclaration {
  return factory.createInterfaceDeclaration(
    [factory.createToken(ts.SyntaxKind.ExportKeyword)],
    factory.createIdentifier(getInterfaceName(name)),
    undefined,
    undefined,
    params.map((param) =>
      factory.createPropertySignature(
        undefined,
        factory.createIdentifier(param.type.name),
        undefined,
        factory.createKeywordTypeNode(getTsType(param.type.type)),
      ),
    ),
  );
}

function getTsType(type: Type): ts.KeywordTypeSyntaxKind {
  if (type === "Bool") {
    return ts.SyntaxKind.BooleanKeyword;
  } else if (typeof type === "string" && /^[IU].*/.test(type)) {
    return ts.SyntaxKind.NumberKeyword;
  } else {
    return ts.SyntaxKind.StringKeyword;
  }
}

function buildInterfaces(context: TransactionContext): ts.InterfaceDeclaration[] {
  return Object.entries(context.inputParams).map(([name, params]) => buildInterface(name, params));
}

function buildInputArgs(context: TransactionContext): ts.ParameterDeclaration[] {
  return Object.entries(context.inputParams).map(([name]) =>
    factory.createParameterDeclaration(
      undefined,
      undefined,
      factory.createIdentifier(name),
      undefined,
      factory.createTypeReferenceNode(factory.createIdentifier(getInterfaceName(name)), undefined),
      undefined,
    ),
  );
}

function buildInputVariable(name: string, params: InputParameter[]) {
  const obj = Object.fromEntries(params.map((param) => [param.type.name, param.value]));
  return factory.createVariableStatement(
    undefined,
    factory.createVariableDeclarationList(
      [
        factory.createVariableDeclaration(
          factory.createIdentifier(name),
          undefined,
          factory.createTypeReferenceNode(factory.createIdentifier(getInterfaceName(name)), undefined),
          transformObjectToAstArray(obj)[0],
        ),
      ],
      ts.NodeFlags.Const,
    ),
  );
}

function buildInputVariables(context: TransactionContext): ts.VariableStatement[] {
  return Object.entries(context.inputParams).map(([name, params]) => buildInputVariable(name, params));
}

function isTypescriptASTNode(obj: unknown): obj is ts.Expression {
  if (typeof obj !== "object" || obj === null || !("kind" in obj) || typeof obj.kind !== "number") {
    return false;
  }
  return syntaxKindValues.includes(obj.kind);
}
